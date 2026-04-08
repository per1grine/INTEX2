using IntexApi.Data;
using IntexApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexApi.Controllers;

public sealed record NotebookStatusDto(
    string Notebook,
    string Status,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string? ErrorMessage);

public sealed record MlStatusResponse(
    bool IsRefreshing,
    List<NotebookStatusDto> Notebooks);

public sealed record MlDomainSummaryDto(
    string Domain,
    string Summary,
    DateTime RefreshedAt);

public sealed record MlPredictionDto(
    int Id,
    string Notebook,
    string RecordId,
    string RecordType,
    string Label,
    decimal? Score,
    string? Tier,
    string? MetaJson,
    DateTime RefreshedAt);

public sealed record MlPredictionsResponse(
    string Notebook,
    int TotalCount,
    int Page,
    int PageSize,
    List<MlPredictionDto> Records);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class MlController(AppDbContext db, NotebookRunnerService runner) : ControllerBase
{
    [HttpGet("status")]
    public async Task<ActionResult<MlStatusResponse>> GetStatus(CancellationToken ct)
    {
        var rows = await db.Database
            .SqlQueryRaw<NotebookStatusDto>(
                """
                SELECT notebook AS "Notebook", status AS "Status",
                       started_at AS "StartedAt", completed_at AS "CompletedAt",
                       error_message AS "ErrorMessage"
                FROM ml_notebook_status
                ORDER BY notebook
                """)
            .ToListAsync(ct);

        return Ok(new MlStatusResponse(runner.IsRefreshing, rows));
    }

    /// <summary>
    /// Fast refresh: re-scores all prediction pipelines using saved model1.sav files.
    /// Completes in seconds. Does NOT retrain models.
    /// </summary>
    [HttpPost("refresh")]
    public ActionResult Refresh()
    {
        if (runner.IsRefreshing)
            return Conflict(new { message = "Refresh already in progress." });
        runner.EnqueueRefresh();
        return Accepted(new { message = "Refresh started." });
    }

    /// <summary>
    /// Full retrain: re-runs all notebooks (explanatory + prediction) from scratch.
    /// This retrains models and may take several minutes. Normally handled by the nightly cron.
    /// </summary>
    [HttpPost("retrain")]
    public ActionResult Retrain()
    {
        if (runner.IsRefreshing)
            return Conflict(new { message = "Retrain already in progress." });
        runner.EnqueueFullRetrain();
        return Accepted(new { message = "Full retrain started." });
    }

    [HttpGet("summaries")]
    public async Task<ActionResult<List<MlDomainSummaryDto>>> GetSummaries(CancellationToken ct)
    {
        var rows = await db.Database
            .SqlQueryRaw<MlDomainSummaryDto>(
                """
                SELECT domain AS "Domain", summary AS "Summary", refreshed_at AS "RefreshedAt"
                FROM ml_domain_summaries
                ORDER BY domain
                """)
            .ToListAsync(ct);
        return Ok(rows);
    }

    [HttpGet("predictions/{notebook}")]
    public async Task<ActionResult<MlPredictionsResponse>> GetPredictions(
        string notebook,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool all = false,
        CancellationToken ct = default)
    {
        if (pageSize > 200) pageSize = 200;
        var offset = (page - 1) * pageSize;

        var total = await db.Database
            .SqlQueryRaw<int>("SELECT COUNT(*)::int AS \"Value\" FROM ml_predictions WHERE notebook = {0}", notebook)
            .FirstAsync(ct);

        List<MlPredictionDto> records;
        if (all)
        {
            records = await db.Database
                .SqlQueryRaw<MlPredictionDto>(
                    """
                    SELECT id AS "Id", notebook AS "Notebook", record_id AS "RecordId",
                           record_type AS "RecordType", label AS "Label", score AS "Score",
                           tier AS "Tier", meta_json AS "MetaJson", refreshed_at AS "RefreshedAt"
                    FROM ml_predictions
                    WHERE notebook = {0}
                    ORDER BY score DESC NULLS LAST
                    """, notebook)
                .ToListAsync(ct);
        }
        else
        {
            records = await db.Database
                .SqlQueryRaw<MlPredictionDto>(
                    """
                    SELECT id AS "Id", notebook AS "Notebook", record_id AS "RecordId",
                           record_type AS "RecordType", label AS "Label", score AS "Score",
                           tier AS "Tier", meta_json AS "MetaJson", refreshed_at AS "RefreshedAt"
                    FROM ml_predictions
                    WHERE notebook = {0}
                    ORDER BY score DESC NULLS LAST
                    LIMIT {1} OFFSET {2}
                    """, notebook, pageSize, offset)
                .ToListAsync(ct);
        }

        return Ok(new MlPredictionsResponse(notebook, total, page, pageSize, records));
    }
}
