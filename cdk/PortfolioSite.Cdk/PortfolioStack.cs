using Amazon.CDK;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;
using Constructs;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.CodeBuild;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SNS.Subscriptions;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.Events.Targets;

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
            Sources = new[] { Amazon.CDK.AWS.S3.Deployment.Source.Asset("../site") },
            DestinationBucket = bucket,
            Distribution = distribution,
            DistributionPaths = new[] { "/*" }
        });

        // ============================================================
        // CodeBuild - CI/CD
        // ============================================================
        var buildProject = new Project(this, "PortfolioBuild", new ProjectProps
        {
            ProjectName = "portfolio-site-deploy",
            Description = "Builds and deploys the portfolio site to S3/CloudFront",
            Source = Amazon.CDK.AWS.CodeBuild.Source.GitHub(new GitHubSourceProps
            {
                Owner = "edgoran",
                Repo = "portfolio-site",
                BranchOrRef = "main",
                Webhook = true,
                WebhookFilters = new[]
                {
                    FilterGroup.InEventOf(EventAction.PUSH).AndBranchIs("main")
                }
            }),
            Environment = new BuildEnvironment
            {
                BuildImage = LinuxBuildImage.STANDARD_7_0,
                ComputeType = ComputeType.SMALL
            },
            BuildSpec = BuildSpec.FromObject(new Dictionary<string, object>
            {
                ["version"] = "0.2",
                ["phases"] = new Dictionary<string, object>
                {
                    ["install"] = new Dictionary<string, object>
                    {
                        ["commands"] = new[] { "echo Installing dependencies..." }
                    },
                    ["build"] = new Dictionary<string, object>
                    {
                        ["commands"] = new[]
                        {
                            "echo Deploying site to S3...",
                            $"aws s3 sync site/ s3://{bucket.BucketName} --delete",
                            $"echo Invalidating CloudFront...",
                            $"aws cloudfront create-invalidation --distribution-id {distribution.DistributionId} --paths '/*'"
                        }
                    }
                },
                ["artifacts"] = new Dictionary<string, object>
                {
                    ["files"] = new[] { "**/*" }
                }
            })
        });

        // ============================================================
        // Build Notifications
        // ============================================================
        var notificationTopic = new Topic(this, "BuildNotifications", new TopicProps
        {
            TopicName = "portfolio-build-notifications"
        });

        notificationTopic.AddSubscription(new EmailSubscription("edgoran@gmail.com"));

        // Notify on build success
        buildProject.OnBuildSucceeded("BuildSuccess", new OnEventOptions
        {
            Target = new SnsTopic(notificationTopic, new SnsTopicProps
            {
                Message = RuleTargetInput.FromObject(new Dictionary<string, object>
                {
                    ["message"] = "Portfolio site deployed successfully",
                    ["build"] = EventField.FromPath("$.detail.build-id"),
                    ["status"] = EventField.FromPath("$.detail.build-status")
                })
            })
        });

        // Notify on build failure
        buildProject.OnBuildFailed("BuildFailed", new OnEventOptions
        {
            Target = new SnsTopic(notificationTopic, new SnsTopicProps
            {
                Message = RuleTargetInput.FromObject(new Dictionary<string, object>
                {
                    ["message"] = "Portfolio site deployment FAILED - check CodeBuild logs",
                    ["build"] = EventField.FromPath("$.detail.build-id"),
                    ["status"] = EventField.FromPath("$.detail.build-status")
                })
            })
        });

        // Grant CodeBuild permissions to deploy
        bucket.GrantReadWrite(buildProject);

        buildProject.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "cloudfront:CreateInvalidation" },
            Resources = new[] { $"arn:aws:cloudfront::{Account}:distribution/{distribution.DistributionId}" }
        }));

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