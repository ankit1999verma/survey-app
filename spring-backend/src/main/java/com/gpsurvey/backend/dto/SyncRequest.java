package com.gpsurvey.backend.dto;
import lombok.Data;
import java.util.List;
import com.gpsurvey.backend.models.Survey;
@Data
public class SyncRequest {
    private List<Survey> surveys;
}
