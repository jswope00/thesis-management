package de.tum.cit.aet.thesis.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import de.tum.cit.aet.thesis.entity.ThesisResearch;

import java.util.UUID;

@Repository
public interface ThesisResearchRepository extends JpaRepository<ThesisResearch, UUID> {

}
