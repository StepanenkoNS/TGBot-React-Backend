import { Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ILayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as StaticEnvironment from '../../../../ReadmeAndConfig/StaticEnvironment';
import { addLambdaIntegration, addMethod, GrantAccessToDDB } from '../Helper';

export function CreateHelpCenterLambdas(that: any, rootResource: apigateway.Resource, enableAPICache: boolean, layers: ILayerVersion[], tables: ITable[]) {
    //добавление ресурсов в шлюз

    const getHCLangingLambda = new NodejsFunction(that, 'GetHCLandingLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'WebPublicPages', 'HC-LandingLambda.ts'),
        handler: 'GetHCLandingLambdaHandler',
        functionName: 'react-HelpCenter-Landing-Get-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            webTable: StaticEnvironment.DynamoDbTables.webTable.name,
            region: StaticEnvironment.GlobalAWSEnvironment.region,
            allowedOrigins: StaticEnvironment.WebResources.allowedOrigins.toString(),
            cookieDomain: StaticEnvironment.WebResources.mainDomainName,
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    const lambdaIntegrationHCLanging = addLambdaIntegration(getHCLangingLambda, enableAPICache);
    addMethod(rootResource, 'landing', 'GET', lambdaIntegrationHCLanging, enableAPICache);

    const getHCsubcategoryLambda = new NodejsFunction(that, 'GetHCsubcategoryLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'WebPublicPages', 'HC-SubCategoryLambda.ts'),
        handler: 'GetHCsubcategoryLambdaHandler',
        functionName: 'react-HelpCenter-Subcategory-Get-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            webTable: StaticEnvironment.DynamoDbTables.webTable.name,
            region: StaticEnvironment.GlobalAWSEnvironment.region,
            allowedOrigins: StaticEnvironment.WebResources.allowedOrigins.toString(),
            cookieDomain: StaticEnvironment.WebResources.mainDomainName,
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });
    const lambdaIntegrationHCSubCategory = addLambdaIntegration(getHCsubcategoryLambda, enableAPICache);
    addMethod(rootResource, 'subcategory', 'GET', lambdaIntegrationHCSubCategory, enableAPICache);

    const getHCArticleLambda = new NodejsFunction(that, 'GetHCArticleLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'WebPublicPages', 'HC-ArticleLambda.ts'),
        handler: 'GetHCArticleLambdaHandler',
        functionName: 'react-HelpCenter-Article-Get-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            webTable: StaticEnvironment.DynamoDbTables.webTable.name,
            region: StaticEnvironment.GlobalAWSEnvironment.region,
            allowedOrigins: StaticEnvironment.WebResources.allowedOrigins.toString(),
            cookieDomain: StaticEnvironment.WebResources.mainDomainName,
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    const lambdaIntegrationHCArticle = addLambdaIntegration(getHCArticleLambda, enableAPICache);
    addMethod(rootResource, 'article', 'GET', lambdaIntegrationHCArticle, enableAPICache);
    GrantAccessToDDB([getHCLangingLambda, getHCsubcategoryLambda, getHCArticleLambda], tables);
}
