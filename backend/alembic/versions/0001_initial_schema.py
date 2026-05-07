"""initial schema — labs, components, attacks, cves, edges, users

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-07

This is the first migration. It creates the full hardware-security graph schema
plus the existing users table.

Note for existing dev databases:
    The previous CVE table had `asset: String` and no relations. If you have a
    dev SQLite file from before, drop it (`rm backend/mose.db`) and run
    `alembic upgrade head` to start clean. We're not bothering with a data
    rescue migration because there's no production data to preserve.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- labs ---------------------------------------------------------------
    op.create_table(
        "labs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("affiliation", sa.String(), nullable=True),
        sa.Column("contact", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_labs_name", "labs", ["name"])

    # --- components ---------------------------------------------------------
    op.create_table(
        "components",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("vendor", sa.String(), nullable=True),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("lab_id", sa.Integer(), sa.ForeignKey("labs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_components_name", "components", ["name"])
    op.create_index("ix_components_vendor", "components", ["vendor"])
    op.create_index("ix_components_model", "components", ["model"])
    op.create_index("ix_components_type", "components", ["type"])

    # --- attack_techniques --------------------------------------------------
    op.create_table(
        "attack_techniques",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("mitre_id", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_attack_techniques_name", "attack_techniques", ["name"])
    op.create_index("ix_attack_techniques_mitre_id", "attack_techniques", ["mitre_id"])
    op.create_index("ix_attack_techniques_category", "attack_techniques", ["category"])

    # --- cves ---------------------------------------------------------------
    op.create_table(
        "cves",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cve_id", sa.String(), nullable=False, unique=True),
        sa.Column("severity", sa.String(), nullable=False),
        sa.Column("cvss", sa.Float(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("remediation_script", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="Active"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_cves_cve_id", "cves", ["cve_id"])
    op.create_index("ix_cves_severity", "cves", ["severity"])
    op.create_index("ix_cves_status", "cves", ["status"])

    # --- cve_affects_component (edge) --------------------------------------
    op.create_table(
        "cve_affects_component",
        sa.Column("cve_id", sa.Integer(), sa.ForeignKey("cves.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("component_id", sa.Integer(), sa.ForeignKey("components.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("contributed_by_lab_id", sa.Integer(), sa.ForeignKey("labs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- cve_uses_attack (edge) --------------------------------------------
    op.create_table(
        "cve_uses_attack",
        sa.Column("cve_id", sa.Integer(), sa.ForeignKey("cves.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("attack_id", sa.Integer(), sa.ForeignKey("attack_techniques.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("contributed_by_lab_id", sa.Integer(), sa.ForeignKey("labs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- component_relations (edge) ----------------------------------------
    op.create_table(
        "component_relations",
        sa.Column("a_id", sa.Integer(), sa.ForeignKey("components.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("b_id", sa.Integer(), sa.ForeignKey("components.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("relation_type", sa.String(), primary_key=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- users (auth) -------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), unique=True),
        sa.Column("hashed_password", sa.String()),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("role", sa.String(), server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])


def downgrade() -> None:
    # Reverse order — drop edges before nodes, nodes before parents.
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("component_relations")
    op.drop_table("cve_uses_attack")
    op.drop_table("cve_affects_component")
    op.drop_index("ix_cves_status", table_name="cves")
    op.drop_index("ix_cves_severity", table_name="cves")
    op.drop_index("ix_cves_cve_id", table_name="cves")
    op.drop_table("cves")
    op.drop_index("ix_attack_techniques_category", table_name="attack_techniques")
    op.drop_index("ix_attack_techniques_mitre_id", table_name="attack_techniques")
    op.drop_index("ix_attack_techniques_name", table_name="attack_techniques")
    op.drop_table("attack_techniques")
    op.drop_index("ix_components_type", table_name="components")
    op.drop_index("ix_components_model", table_name="components")
    op.drop_index("ix_components_vendor", table_name="components")
    op.drop_index("ix_components_name", table_name="components")
    op.drop_table("components")
    op.drop_index("ix_labs_name", table_name="labs")
    op.drop_table("labs")
