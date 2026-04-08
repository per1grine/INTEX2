namespace IntexApi.Services;

public sealed class MlOptions
{
    public string DatabaseUrl { get; set; } = "";
    public string NotebooksDir { get; set; } = "../ml-pipelines";
    public string PythonExecutable { get; set; } = "python";
}
