using Amazon.CDK;

namespace PortfolioSite.Cdk;

class Program
{
    static void Main(string[] args)
    {
        var app = new App();

        new PortfolioStack(app, "PortfolioStack", new StackProps
        {
            Env = new Amazon.CDK.Environment
            {
                Account = System.Environment.GetEnvironmentVariable("CDK_DEFAULT_ACCOUNT"),
                Region = "eu-west-2"
            }
        });

        app.Synth();
    }
}