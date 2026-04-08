using System.Text.Json;
using IntexApi.Data;
using Microsoft.EntityFrameworkCore;

namespace IntexApi.Services;

/// <summary>
/// Runs once on startup and then every day at 06:00 UTC.
/// Writes the computed stats into the impact_stats_cache table so the
/// API endpoint can serve a fast cached read instead of live queries.
/// </summary>
public sealed class ImpactCacheService(IServiceScopeFactory scopeFactory, ILogger<ImpactCacheService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Refresh immediately on startup so the cache is warm right away.
        await RefreshAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = TimeUntilNextRun(TimeOnly.FromTimeSpan(TimeSpan.FromHours(6)));
            logger.LogInformation("ImpactCacheService: next refresh in {delay}", delay);
            await Task.Delay(delay, stoppingToken);
            await RefreshAsync(stoppingToken);
        }
    }

    private static TimeSpan TimeUntilNextRun(TimeOnly targetUtc)
    {
        var now = DateTime.UtcNow;
        var next = new DateTime(now.Year, now.Month, now.Day,
            targetUtc.Hour, targetUtc.Minute, 0, DateTimeKind.Utc);
        if (next <= now) next = next.AddDays(1);
        return next - now;
    }

    public async Task RefreshAsync(CancellationToken ct = default)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var stats = await ImpactQueryHelper.ComputeAsync(db, ct);
            var json = JsonSerializer.Serialize(stats);

            await db.Database.ExecuteSqlRawAsync("""
                INSERT INTO impact_stats_cache (id, computed_at_utc, payload_json)
                VALUES (1, NOW(), {0})
                ON CONFLICT (id) DO UPDATE
                    SET computed_at_utc = EXCLUDED.computed_at_utc,
                        payload_json    = EXCLUDED.payload_json;
                """, [json]);

            logger.LogInformation("ImpactCacheService: stats refreshed at {time}", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ImpactCacheService: failed to refresh stats");
        }
    }
}
