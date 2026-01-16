"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2026-01-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create surveys table
    op.create_table(
        'surveys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_surveys_id'), 'surveys', ['id'], unique=False)

    # Create survey_questions table
    op.create_table(
        'survey_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('survey_id', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.String(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['survey_id'], ['surveys.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_survey_questions_id'), 'survey_questions', ['id'], unique=False)

    # Create survey_submissions table
    op.create_table(
        'survey_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('survey_id', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(), nullable=False),
        sa.Column('device', sa.String(), nullable=True),
        sa.Column('browser', sa.String(), nullable=True),
        sa.Column('os', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['survey_id'], ['surveys.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_survey_submissions_id'), 'survey_submissions', ['id'], unique=False)

    # Create survey_answers table
    op.create_table(
        'survey_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('answer', sa.String(), nullable=False),
        sa.Column('face_detected', sa.Boolean(), nullable=True),
        sa.Column('face_score', sa.Float(), nullable=True),
        sa.Column('face_image_path', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['survey_questions.id'], ),
        sa.ForeignKeyConstraint(['submission_id'], ['survey_submissions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_survey_answers_id'), 'survey_answers', ['id'], unique=False)

    # Create media_files table
    op.create_table(
        'media_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('path', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['survey_submissions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_media_files_id'), 'media_files', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_media_files_id'), table_name='media_files')
    op.drop_table('media_files')
    op.drop_index(op.f('ix_survey_answers_id'), table_name='survey_answers')
    op.drop_table('survey_answers')
    op.drop_index(op.f('ix_survey_submissions_id'), table_name='survey_submissions')
    op.drop_table('survey_submissions')
    op.drop_index(op.f('ix_survey_questions_id'), table_name='survey_questions')
    op.drop_table('survey_questions')
    op.drop_index(op.f('ix_surveys_id'), table_name='surveys')
    op.drop_table('surveys')
