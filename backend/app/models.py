"""SQLAlchemy models for MoSE DB.

Domain: hardware / semiconductor security. The graph is intentionally explicit
via association tables (instead of plain many-to-many) because every link
also carries provenance — which lab contributed it and any free-form notes.

Entities
--------
- Lab                — the source / contributor (our lab + collaborating labs)
- Component          — a hardware piece (SoC, MCU, board, firmware, ...)
- CVE                — a vulnerability record
- AttackTechnique    — how a CVE is exploited (side-channel, fault injection, ...)

Edges
-----
- CVEAffectsComponent  — which CVEs touch which components, contributed by which lab
- CVEUsesAttack        — which attack techniques exploit a CVE, contributed by which lab
- ComponentRelation    — component-to-component (contains / connects_to / variant_of)
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# ---------------------------------------------------------------------------
# Core entities
# ---------------------------------------------------------------------------

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    affiliation = Column(String, nullable=True)   # e.g., "Kookmin University"
    contact = Column(String, nullable=True)       # email / URL
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    components = relationship("Component", back_populates="lab")


class Component(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)        # "STM32F407 SoC"
    vendor = Column(String, nullable=True, index=True)       # "STMicroelectronics"
    model = Column(String, nullable=True, index=True)        # "STM32F407VG"
    type = Column(String, nullable=False, index=True)        # SoC | MCU | Memory | Bus | Firmware | Board | Sensor
    notes = Column(Text, nullable=True)
    lab_id = Column(Integer, ForeignKey("labs.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lab = relationship("Lab", back_populates="components")
    cve_links = relationship(
        "CVEAffectsComponent",
        back_populates="component",
        cascade="all, delete-orphan",
    )

    # Self-referential graph edges. Two views: outgoing edges (from this
    # component) and incoming edges (toward this component).
    outgoing_relations = relationship(
        "ComponentRelation",
        foreign_keys="ComponentRelation.a_id",
        back_populates="a",
        cascade="all, delete-orphan",
    )
    incoming_relations = relationship(
        "ComponentRelation",
        foreign_keys="ComponentRelation.b_id",
        back_populates="b",
        cascade="all, delete-orphan",
    )


class CVE(Base):
    __tablename__ = "cves"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, unique=True, nullable=False, index=True)  # "CVE-2024-3094"
    severity = Column(String, nullable=False, index=True)             # Critical | High | Medium | Low
    cvss = Column(Float, nullable=True)                                # 0.0 - 10.0
    description = Column(Text, nullable=True)
    remediation_script = Column(Text, nullable=True)
    status = Column(String, default="Active", nullable=False, index=True)  # Active | Resolved | Investigating
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    component_links = relationship(
        "CVEAffectsComponent",
        back_populates="cve",
        cascade="all, delete-orphan",
    )
    attack_links = relationship(
        "CVEUsesAttack",
        back_populates="cve",
        cascade="all, delete-orphan",
    )


class AttackTechnique(Base):
    __tablename__ = "attack_techniques"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # "Voltage Glitch"
    mitre_id = Column(String, nullable=True, index=True)            # MITRE ATT&CK ref, e.g. "T1499"
    category = Column(String, nullable=True, index=True)            # Side-channel | Fault Injection | Supply Chain | Firmware | ...
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cve_links = relationship(
        "CVEUsesAttack",
        back_populates="attack",
        cascade="all, delete-orphan",
    )


# ---------------------------------------------------------------------------
# Edges (association tables with extra columns -> regular models)
# ---------------------------------------------------------------------------

class CVEAffectsComponent(Base):
    __tablename__ = "cve_affects_component"

    cve_id = Column(Integer, ForeignKey("cves.id", ondelete="CASCADE"), primary_key=True)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"), primary_key=True)
    contributed_by_lab_id = Column(Integer, ForeignKey("labs.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cve = relationship("CVE", back_populates="component_links")
    component = relationship("Component", back_populates="cve_links")
    contributor = relationship("Lab")


class CVEUsesAttack(Base):
    __tablename__ = "cve_uses_attack"

    cve_id = Column(Integer, ForeignKey("cves.id", ondelete="CASCADE"), primary_key=True)
    attack_id = Column(Integer, ForeignKey("attack_techniques.id", ondelete="CASCADE"), primary_key=True)
    contributed_by_lab_id = Column(Integer, ForeignKey("labs.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cve = relationship("CVE", back_populates="attack_links")
    attack = relationship("AttackTechnique", back_populates="cve_links")
    contributor = relationship("Lab")


class ComponentRelation(Base):
    __tablename__ = "component_relations"

    a_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"), primary_key=True)
    b_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"), primary_key=True)
    # Composite PK includes relation_type so multiple kinds of edges between
    # the same pair are allowed (rare, but cheap to support).
    relation_type = Column(String, primary_key=True)  # contains | connects_to | variant_of | depends_on
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    a = relationship("Component", foreign_keys=[a_id], back_populates="outgoing_relations")
    b = relationship("Component", foreign_keys=[b_id], back_populates="incoming_relations")


# ---------------------------------------------------------------------------
# Users (auth) — unchanged from prior schema
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user")  # user | admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
