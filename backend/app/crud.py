"""Thin CRUD layer over the ORM.

Two design choices worth knowing:

1. Edge writes go through dedicated helpers (`link_cve_to_component`, etc.)
   that use `merge`-style upserts. Calling them twice with the same pair is
   safe — they update notes/contributor instead of erroring on the composite
   primary key.

2. Read helpers that touch relations use `joinedload` so a single call returns
   everything the API response needs without N+1 queries.
"""

from typing import Dict, List, Optional, Set

from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .auth_utils import get_password_hash


# ---------------------------------------------------------------------------
# Lab
# ---------------------------------------------------------------------------

def get_labs(db: Session, skip: int = 0, limit: int = 100) -> List[models.Lab]:
    return db.query(models.Lab).order_by(models.Lab.name).offset(skip).limit(limit).all()


def get_lab(db: Session, lab_id: int) -> Optional[models.Lab]:
    return db.query(models.Lab).filter(models.Lab.id == lab_id).first()


def get_lab_by_name(db: Session, name: str) -> Optional[models.Lab]:
    return db.query(models.Lab).filter(models.Lab.name == name).first()


def create_lab(db: Session, lab: schemas.LabCreate) -> models.Lab:
    db_lab = models.Lab(**lab.dict())
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab


# ---------------------------------------------------------------------------
# Component
# ---------------------------------------------------------------------------

def get_components(db: Session, skip: int = 0, limit: int = 200, type: Optional[str] = None) -> List[models.Component]:
    q = db.query(models.Component)
    if type:
        q = q.filter(models.Component.type == type)
    return q.order_by(models.Component.name).offset(skip).limit(limit).all()


def get_component(db: Session, component_id: int) -> Optional[models.Component]:
    return db.query(models.Component).filter(models.Component.id == component_id).first()


def create_component(db: Session, component: schemas.ComponentCreate) -> models.Component:
    db_comp = models.Component(**component.dict())
    db.add(db_comp)
    db.commit()
    db.refresh(db_comp)
    return db_comp


# ---------------------------------------------------------------------------
# AttackTechnique
# ---------------------------------------------------------------------------

def get_attacks(db: Session, skip: int = 0, limit: int = 200) -> List[models.AttackTechnique]:
    return db.query(models.AttackTechnique).order_by(models.AttackTechnique.name).offset(skip).limit(limit).all()


def get_attack(db: Session, attack_id: int) -> Optional[models.AttackTechnique]:
    return db.query(models.AttackTechnique).filter(models.AttackTechnique.id == attack_id).first()


def get_attack_by_name(db: Session, name: str) -> Optional[models.AttackTechnique]:
    return db.query(models.AttackTechnique).filter(models.AttackTechnique.name == name).first()


def create_attack(db: Session, attack: schemas.AttackTechniqueCreate) -> models.AttackTechnique:
    db_atk = models.AttackTechnique(**attack.dict())
    db.add(db_atk)
    db.commit()
    db.refresh(db_atk)
    return db_atk


# ---------------------------------------------------------------------------
# CVE
# ---------------------------------------------------------------------------

def get_cves(db: Session, skip: int = 0, limit: int = 100, severity: Optional[str] = None) -> List[models.CVE]:
    q = db.query(models.CVE)
    if severity:
        q = q.filter(models.CVE.severity == severity)
    return q.order_by(models.CVE.created_at.desc()).offset(skip).limit(limit).all()


def get_cve(db: Session, cve_id: int) -> Optional[models.CVE]:
    return db.query(models.CVE).filter(models.CVE.id == cve_id).first()


def get_cve_by_cve_id(db: Session, cve_id: str) -> Optional[models.CVE]:
    return db.query(models.CVE).filter(models.CVE.cve_id == cve_id).first()


def get_cve_with_relations(db: Session, cve_id: int) -> Optional[models.CVE]:
    """Return a CVE with neighbor edges eager-loaded (no N+1)."""
    return (
        db.query(models.CVE)
        .options(
            joinedload(models.CVE.component_links).joinedload(models.CVEAffectsComponent.component),
            joinedload(models.CVE.component_links).joinedload(models.CVEAffectsComponent.contributor),
            joinedload(models.CVE.attack_links).joinedload(models.CVEUsesAttack.attack),
            joinedload(models.CVE.attack_links).joinedload(models.CVEUsesAttack.contributor),
        )
        .filter(models.CVE.id == cve_id)
        .first()
    )


def create_cve(db: Session, cve: schemas.CVECreate) -> models.CVE:
    db_cve = models.CVE(**cve.dict())
    db.add(db_cve)
    db.commit()
    db.refresh(db_cve)
    return db_cve


# ---------------------------------------------------------------------------
# Edges (idempotent upserts)
# ---------------------------------------------------------------------------

def link_cve_to_component(db: Session, payload: schemas.CVEAffectsComponentCreate) -> models.CVEAffectsComponent:
    existing = (
        db.query(models.CVEAffectsComponent)
        .filter_by(cve_id=payload.cve_id, component_id=payload.component_id)
        .first()
    )
    if existing:
        existing.contributed_by_lab_id = payload.contributed_by_lab_id
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing

    edge = models.CVEAffectsComponent(**payload.dict())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge


def link_cve_to_attack(db: Session, payload: schemas.CVEUsesAttackCreate) -> models.CVEUsesAttack:
    existing = (
        db.query(models.CVEUsesAttack)
        .filter_by(cve_id=payload.cve_id, attack_id=payload.attack_id)
        .first()
    )
    if existing:
        existing.contributed_by_lab_id = payload.contributed_by_lab_id
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing

    edge = models.CVEUsesAttack(**payload.dict())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge


def link_components(db: Session, payload: schemas.ComponentRelationCreate) -> models.ComponentRelation:
    existing = (
        db.query(models.ComponentRelation)
        .filter_by(a_id=payload.a_id, b_id=payload.b_id, relation_type=payload.relation_type)
        .first()
    )
    if existing:
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing

    edge = models.ComponentRelation(**payload.dict())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge


# ---------------------------------------------------------------------------
# Graph overview — flat nodes + edges for the visualization page
# ---------------------------------------------------------------------------

def get_graph_overview(db: Session, cve_limit: int = 50) -> schemas.GraphOverview:
    """Return a node/edge payload covering the most recent CVEs and everything
    they touch. Bounded by `cve_limit` so the graph stays renderable."""
    cves = (
        db.query(models.CVE)
        .options(
            joinedload(models.CVE.component_links).joinedload(models.CVEAffectsComponent.component),
            joinedload(models.CVE.component_links).joinedload(models.CVEAffectsComponent.contributor),
            joinedload(models.CVE.attack_links).joinedload(models.CVEUsesAttack.attack),
            joinedload(models.CVE.attack_links).joinedload(models.CVEUsesAttack.contributor),
        )
        .order_by(models.CVE.created_at.desc())
        .limit(cve_limit)
        .all()
    )

    nodes: dict[str, schemas.GraphNode] = {}
    edges: list[schemas.GraphEdge] = []

    def add_node(node: schemas.GraphNode) -> None:
        nodes.setdefault(node.id, node)

    for cve in cves:
        cve_node_id = f"cve:{cve.id}"
        add_node(schemas.GraphNode(
            id=cve_node_id, type="cve", label=cve.cve_id,
            severity=cve.severity, cvss=cve.cvss,
        ))

        for link in cve.component_links:
            comp = link.component
            comp_id = f"component:{comp.id}"
            add_node(schemas.GraphNode(
                id=comp_id, type="component", label=comp.name, category=comp.type,
            ))
            edges.append(schemas.GraphEdge(
                source=cve_node_id, target=comp_id, type="affects", notes=link.notes,
            ))
            if link.contributor:
                lab_id = f"lab:{link.contributor.id}"
                add_node(schemas.GraphNode(id=lab_id, type="lab", label=link.contributor.name))
                edges.append(schemas.GraphEdge(source=lab_id, target=cve_node_id, type="contributes"))

        for link in cve.attack_links:
            atk = link.attack
            atk_id = f"attack:{atk.id}"
            add_node(schemas.GraphNode(
                id=atk_id, type="attack", label=atk.name, category=atk.category,
            ))
            edges.append(schemas.GraphEdge(
                source=atk_id, target=cve_node_id, type="uses", notes=link.notes,
            ))

    # Component-to-component edges among nodes we've already pulled in
    component_ids = [int(nid.split(":", 1)[1]) for nid in nodes if nid.startswith("component:")]
    if component_ids:
        for rel in db.query(models.ComponentRelation).filter(
            models.ComponentRelation.a_id.in_(component_ids),
            models.ComponentRelation.b_id.in_(component_ids),
        ).all():
            edges.append(schemas.GraphEdge(
                source=f"component:{rel.a_id}",
                target=f"component:{rel.b_id}",
                type=rel.relation_type,
                notes=rel.notes,
            ))

    return schemas.GraphOverview(nodes=list(nodes.values()), edges=edges)


# ---------------------------------------------------------------------------
# Bulk import — idempotent ingest of a bundle from another lab
# ---------------------------------------------------------------------------

def import_bundle(db: Session, bundle: schemas.BundleImport) -> schemas.ImportResult:
    """Upsert a bundle keyed by natural identifiers (name / cve_id).

    Behavior:
    - Re-running with the same payload is a no-op (created counts return 0).
    - Existing records get their non-null fields refreshed (updated count).
    - Unresolved component/attack names referenced by a CVE are reported as
      warnings rather than errors — partial imports are useful.
    - The whole import runs in one transaction; any failure rolls back.
    """
    created = schemas.ImportCounts()
    updated = schemas.ImportCounts()
    linked = schemas.ImportLinkCounts()
    warnings: List[str] = []

    # ---- Lab (the contributor) -----------------------------------------
    contributor: Optional[models.Lab] = None
    if bundle.lab is not None:
        contributor = get_lab_by_name(db, bundle.lab.name)
        if contributor:
            _patch_fields(contributor, bundle.lab.dict(exclude_unset=True), exclude={"name"})
            updated.labs += 1
        else:
            contributor = models.Lab(**bundle.lab.dict())
            db.add(contributor)
            db.flush()
            created.labs += 1

    # ---- Components ----------------------------------------------------
    component_index: Dict[str, models.Component] = {}
    for spec in bundle.components:
        existing = (
            db.query(models.Component).filter(models.Component.name == spec.name).first()
        )
        if existing:
            _patch_fields(existing, spec.dict(exclude_unset=True), exclude={"name"})
            updated.components += 1
            component_index[spec.name] = existing
        else:
            data = spec.dict()
            # If no explicit lab_id was supplied, attribute to the contributor.
            if data.get("lab_id") is None and contributor is not None:
                data["lab_id"] = contributor.id
            new_comp = models.Component(**data)
            db.add(new_comp)
            db.flush()
            created.components += 1
            component_index[spec.name] = new_comp

    # ---- Attack techniques --------------------------------------------
    attack_index: Dict[str, models.AttackTechnique] = {}
    for spec in bundle.attacks:
        existing = get_attack_by_name(db, spec.name)
        if existing:
            _patch_fields(existing, spec.dict(exclude_unset=True), exclude={"name"})
            updated.attacks += 1
            attack_index[spec.name] = existing
        else:
            new_atk = models.AttackTechnique(**spec.dict())
            db.add(new_atk)
            db.flush()
            created.attacks += 1
            attack_index[spec.name] = new_atk

    # ---- CVEs + edges --------------------------------------------------
    for spec in bundle.cves:
        cve = get_cve_by_cve_id(db, spec.cve_id)
        cve_fields = spec.dict(exclude={"affects", "attacks"})
        if cve:
            _patch_fields(cve, {k: v for k, v in cve_fields.items() if v is not None}, exclude={"cve_id"})
            updated.cves += 1
        else:
            cve = models.CVE(**cve_fields)
            db.add(cve)
            db.flush()
            created.cves += 1

        # Resolve component links — fall back to a global lookup so partners
        # can reference assets they haven't restated in this bundle.
        for comp_name in spec.affects:
            comp = component_index.get(comp_name) or (
                db.query(models.Component).filter(models.Component.name == comp_name).first()
            )
            if not comp:
                warnings.append(f"CVE {spec.cve_id}: component '{comp_name}' not found, link skipped")
                continue
            if not db.query(models.CVEAffectsComponent).filter_by(
                cve_id=cve.id, component_id=comp.id
            ).first():
                db.add(models.CVEAffectsComponent(
                    cve_id=cve.id,
                    component_id=comp.id,
                    contributed_by_lab_id=contributor.id if contributor else None,
                ))
                linked.cve_affects_component += 1

        for atk_name in spec.attacks:
            atk = attack_index.get(atk_name) or get_attack_by_name(db, atk_name)
            if not atk:
                warnings.append(f"CVE {spec.cve_id}: attack '{atk_name}' not found, link skipped")
                continue
            if not db.query(models.CVEUsesAttack).filter_by(
                cve_id=cve.id, attack_id=atk.id
            ).first():
                db.add(models.CVEUsesAttack(
                    cve_id=cve.id,
                    attack_id=atk.id,
                    contributed_by_lab_id=contributor.id if contributor else None,
                ))
                linked.cve_uses_attack += 1

    db.commit()
    if contributor:
        db.refresh(contributor)

    return schemas.ImportResult(
        lab=schemas.Lab.from_orm(contributor) if contributor else None,
        created=created,
        updated=updated,
        linked=linked,
        warnings=warnings,
    )


def _patch_fields(obj, fields: dict, exclude: Optional[Set[str]] = None) -> None:
    """Copy non-None fields from a dict onto an ORM object, skipping `exclude`.

    Used by import to refresh existing rows without overwriting the natural-key
    column or wiping unspecified attributes.
    """
    exclude = exclude or set()
    for k, v in fields.items():
        if k in exclude or v is None:
            continue
        setattr(obj, k, v)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
