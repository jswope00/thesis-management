package de.tum.cit.aet.thesis.controller.payload;

public record RejectApplicationPayload (
        String comment,
        Boolean notifyUser,
        Boolean rejectAll
) { }
