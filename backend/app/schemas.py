"""Pydantic schemas for the MoSE DB API.

Two layers per entity:
  * `<Entity>Base` / `<Entity>Create` — incoming payloads.
  * `<Entity>` — slim outgoing shape (no relations).

For graph queries we expose dedicated read shapes (e.g. `CVEWithRelations`)
that include neighbors, so the frontend can render a CVE card and its
connected components/attacks/labs in one round-trip.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Lab
# ---------------------------------------------------------------------------

class LabBase(BaseModel):
    name: str
    affiliation: Optional[str] = None
    contact: Optional[str] = None
    description: Optional[str] = None


class LabCreate(LabBase):
    pass


class Lab(LabBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------------------------------------------------------------------
# Component
# ---------------------------------------------------------------------------

class ComponentBase(BaseModel):
    name: str
    type: str
    vendor: Optional[str] = None
    model: Optional[str] = None
    notes: Optional[str] = None
    lab_id: Optional[int] = None


class ComponentCreate(ComponentBase):
    pass


class Component(ComponentBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------------------------------------------------------------------
# Attack technique
# ---------------------------------------------------------------------------

class AttackTechniqueBase(BaseModel):
    name: str
    mitre_id: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class AttackTechniqueCreate(AttackTechniqueBase):
    pass


class AttackTechnique(AttackTechniqueBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------------------------------------------------------------------
# CVE
# ---------------------------------------------------------------------------

class CVEBase(BaseModel):
    cve_id: str
    severity: str
    cvss: Optional[float] = None
    description: Optional[str] = None
    remediation_script: Optional[str] = None
    status: str = "Active"
    published_at: Optional[datetime] = None


class CVECreate(CVEBase):
    pass


class CVE(CVEBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------------------------------------------------------------------
# Edges — outgoing shapes for graph reads
# ---------------------------------------------------------------------------

class ComponentLink(BaseModel):
    """One CVE-affects-Component edge, denormalized for the frontend."""
    component: Component
    contributor: Optional[Lab] = None
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class AttackLink(BaseModel):
    """One CVE-uses-AttackTechnique edge."""
    attack: AttackTechnique
    contributor: Optional[Lab] = None
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class ComponentRelationOut(BaseModel):
    a_id: int
    b_id: int
    relation_type: str
    notes: Optional[str] = None

    class Config:
        orm_mode = True


# ---------------------------------------------------------------------------
# Aggregated read shapes (the "graph view" payloads)
# ---------------------------------------------------------------------------

class CVEWithRelations(CVE):
    """CVE plus its connected components and attack techniques.

    Aliases let us populate from the ORM relationships (`component_links`,
    `attack_links`) while exposing friendlier names in the JSON response.
    """
    components: List[ComponentLink] = Field(default_factory=list, alias="component_links")
    attacks: List[AttackLink] = Field(default_factory=list, alias="attack_links")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class ComponentWithRelations(Component):
    cves: List[CVE] = Field(default_factory=list)
    related: List[ComponentRelationOut] = Field(default_factory=list)

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


# ---------------------------------------------------------------------------
# Graph visualization payload — flat nodes + edges (react-flow / cytoscape friendly)
# ---------------------------------------------------------------------------

class GraphNode(BaseModel):
    id: str          # "cve:1", "component:5", "attack:3", "lab:2"
    type: str        # cve | component | attack | lab
    label: str
    severity: Optional[str] = None
    category: Optional[str] = None
    cvss: Optional[float] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str        # affects | uses | contains | connects_to | variant_of | depends_on | contributes
    notes: Optional[str] = None


class GraphOverview(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


# ---------------------------------------------------------------------------
# Edge create payloads
# ---------------------------------------------------------------------------

class CVEAffectsComponentCreate(BaseModel):
    cve_id: int
    component_id: int
    contributed_by_lab_id: Optional[int] = None
    notes: Optional[str] = None


class CVEUsesAttackCreate(BaseModel):
    cve_id: int
    attack_id: int
    contributed_by_lab_id: Optional[int] = None
    notes: Optional[str] = None


class ComponentRelationCreate(BaseModel):
    a_id: int
    b_id: int
    relation_type: str
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Users / auth — unchanged
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class User(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
