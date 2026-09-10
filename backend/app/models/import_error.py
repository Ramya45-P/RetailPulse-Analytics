from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class ImportErrorRecord(Base):
    __tablename__ = "import_errors"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    import_id = Column(
        Integer,
        ForeignKey("import_history.id"),
        nullable=False
    )

    row_number = Column(
        Integer,
        nullable=False
    )

    error_type = Column(
        String(50),
        nullable=False
    )

    error_message = Column(
        Text,
        nullable=False
    )

    row_data = Column(
        Text,
        nullable=True
    )

    import_history = relationship(
        "ImportHistory",
        back_populates="errors"
    )