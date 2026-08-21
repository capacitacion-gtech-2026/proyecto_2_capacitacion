# Rol OIDC para el despliegue de la aplicación

El workflow asume el rol:

```text
arn:aws:iam::211125740019:role/proyecto-2-app-deploy
```

La cuenta debe tener previamente el proveedor OIDC de GitHub Actions para
`https://token.actions.githubusercontent.com`, con audiencia
`sts.amazonaws.com`.

## Relación de confianza

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::211125740019:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": [
            "repo:capacitacion-gtech-2026@317968382/proyecto_2_capacitacion@1324324405:ref:refs/heads/docker-ECR",
            "repo:capacitacion-gtech-2026@317968382/proyecto_2_capacitacion@1324324405:ref:refs/heads/main"
          ]
        }
      }
    }
  ]
}
```

## Política de permisos mínima

Agregar la siguiente política inline al rol `proyecto-2-app-deploy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuthenticateToEcr",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "PublishOnlyToApplicationRepository",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr:us-east-1:211125740019:repository/proyecto-2-capacitacion"
    },
    {
      "Sid": "FindApplicationInstance",
      "Effect": "Allow",
      "Action": "ec2:DescribeInstances",
      "Resource": "*"
    },
    {
      "Sid": "UseOnlyRunShellScript",
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": "arn:aws:ssm:us-east-1::document/AWS-RunShellScript"
    },
    {
      "Sid": "RunOnlyOnTaggedApplicationInstance",
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": "arn:aws:ec2:us-east-1:211125740019:instance/*",
      "Condition": {
        "StringEquals": {
          "ssm:resourceTag/Name": "proyecto-2-application-server"
        }
      }
    },
    {
      "Sid": "ReadCommandResult",
      "Effect": "Allow",
      "Action": [
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations"
      ],
      "Resource": "*"
    }
  ]
}
```

No se requieren `AdministratorAccess`, claves de acceso permanentes, SSH ni
permisos para crear EC2 o ECR.
