package de.tum.cit.aet.thesis.controller.payload;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AcceptProposalPayload(
    @NotNull
    @Min(0)
    @Max(100)
    Integer grade
) {
}
