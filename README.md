# Portfolio Site

A personal portfolio and project showcase hosted on AWS.

Live at: [portfolio.edgoran.co.uk](https://portfolio.edgoran.co.uk)

## Features

- Single-page application with tab navigation
- Dark and light theme with system preference detection
- WCAG AAA accessibility mode (high contrast, larger text, visible focus indicators)
- Responsive design for mobile and desktop
- Print-optimised styles
- Project deep-dive timelines
- Contact page with copy-to-clipboard

## Tech Stack

- HTML / CSS / JavaScript (vanilla, no frameworks)
- AWS S3 (static file hosting)
- AWS CloudFront (CDN, HTTPS)
- AWS Route 53 (DNS, custom domain)
- AWS Certificate Manager (SSL)
- AWS CDK in C# (infrastructure as code)

## Architecture

```
Route 53 (portfolio.edgoran.co.uk)
    │
    ▼
CloudFront Distribution (HTTPS, caching)
    │
    ▼
S3 Bucket (static files)
```

### Prerequisites

- AWS CLI configured (`aws configure`)
- .NET 8 SDK
- AWS CDK CLI (`npm install -g aws-cdk`)

### Environment Variables

Set these before deploying:

```bash
export CDK_DEFAULT_ACCOUNT=your-account-id
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:account:certificate/id
```

The certificate must be in us-east-1 (CloudFront requirement).

### Deploy

```bash
cd cdk
dotnet build PortfolioSite.Cdk
cdk deploy
```

This will:
1. Create/update the S3 bucket
2. Upload site files
3. Create/update CloudFront distribution
4. Configure DNS records
5. Invalidate CloudFront cache

## Local Development

Open `site/index.html` in a browser. No build step required.

## Project Structure

```
portfolio-site/
├── site/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── images/
└── cdk/
    ├── cdk.json
    └── PortfolioSite.Cdk/
        ├── Program.cs
        ├── PortfolioStack.cs
        └── PortfolioSite.Cdk.csproj
```

## Cost

| Service | Monthly Cost |
|---------|-------------|
| S3 | ~$0.01 |
| CloudFront | ~$0.00 (low traffic) |
| Route 53 hosted zone | $0.50 |
| SSL Certificate | Free |
| **Total** | **Under $1/month** |
