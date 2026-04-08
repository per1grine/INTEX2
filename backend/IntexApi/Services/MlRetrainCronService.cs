namespace IntexApi.Services;

/// <summary>
/// Nightly cron: re-trains all ML models by running the full notebooks (explanatory + prediction).
/// Fires once per day at midnight UTC.  On startup it also schedules the next run so the
/// service is resilient to backend restarts.
/// </summary>
public sealed class MlRetrainCronService(
    NotebookRunnerService runner,
    ILogger<MlRetrainCronService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ML cron: nightly retrain service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = TimeUntilNextMidnightUtc();
            logger.LogInformation("ML cron: next full retrain in {delay:hh\\:mm\\:ss}", delay);

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            if (stoppingToken.IsCancellationRequested) break;

            logger.LogInformation("ML cron: triggering nightly full retrain");
            runner.EnqueueFullRetrain();

            // Wait a bit so we don't fire twice in the same midnight minute
            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        }
    }

    private static TimeSpan TimeUntilNextMidnightUtc()
    {
        var now = DateTime.UtcNow;
        var nextMidnight = now.Date.AddDays(1);
        return nextMidnight - now;
    }
}
