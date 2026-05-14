using Amazon.CDK;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;
using Constructs;
using Amazon.CDK.AWS.CloudFront.Origins;

namespace PortfolioSite.Cdk;

public class PortfolioStack : Stack
{
    public PortfolioStack(Construct scope, string id, IStackProps? props = null) : base(scope, id, props)
    {
        var domainName = "portfolio.edgoran.co.uk";
        var rootDomain = "edgoran.co.uk";

        // Look up the hosted zone
        var hostedZone = HostedZone.FromLookup(this, "Zone", new HostedZoneProviderProps
        {
            DomainName = rootDomain
        });

        // Reference the certificate (must be in us-east-1)
        var certArn = System.Environment.GetEnvironmentVariable("CERTIFICATE_ARN")
            ?? throw new Exception("CERTIFICATE_ARN environment variable not set");

        var certificate = Certificate.FromCertificateArn(this, "Certificate", certArn);

        // S3 Bucket
        var bucket = new Bucket(this, "PortfolioBucket", new BucketProps
        {
            BucketName = $"edgoran-portfolio-{Account}",
            RemovalPolicy = RemovalPolicy.DESTROY,
            AutoDeleteObjects = true,
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL
        });

        // CloudFront Distribution
        var distribution = new Distribution(this, "PortfolioDistribution", new DistributionProps
        {
            DefaultBehavior = new BehaviorOptions
            {
                Origin = S3BucketOrigin.WithOriginAccessControl(bucket),
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            },
            DefaultRootObject = "index.html",
            DomainNames = new[] { domainName },
            Certificate = certificate,
            ErrorResponses = new[]
            {
                new ErrorResponse
                {
                    HttpStatus = 404,
                    ResponseHttpStatus = 200,
                    ResponsePagePath = "/index.html"
                }
            }
        });

        // DNS record: portfolio.edgoran.co.uk -> CloudFront
        new ARecord(this, "PortfolioAliasRecord", new ARecordProps
        {
            Zone = hostedZone,
            Target = RecordTarget.FromAlias(new CloudFrontTarget(distribution)),
            RecordName = "portfolio"
        });

        // Deploy site files
        new BucketDeployment(this, "DeployPortfolio", new BucketDeploymentProps
        {
            Sources = new[] { Source.Asset("../site") },
            DestinationBucket = bucket,
            Distribution = distribution,
            DistributionPaths = new[] { "/*" }
        });

        // Outputs
        new CfnOutput(this, "SiteUrl", new CfnOutputProps
        {
            Value = $"https://{domainName}",
            Description = "Portfolio site URL"
        });

        new CfnOutput(this, "CloudFrontUrl", new CfnOutputProps
        {
            Value = $"https://{distribution.DistributionDomainName}",
            Description = "CloudFront URL"
        });
    }
}