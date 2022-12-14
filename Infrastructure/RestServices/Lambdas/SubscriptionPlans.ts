import { Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ILayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as StaticEnvironment from '../../../../ReadmeAndConfig/StaticEnvironment';
import { GrantAccessToDDB } from '../Helper';

export function CreateSubscriptionPlansLambdas(that: any, rootResource: apigateway.Resource, layers: ILayerVersion[], tables: ITable[]) {
    //добавление ресурсов в шлюз
    const lambdaListSubscriptionPlansResource = rootResource.addResource('List');
    const lambdaGetSubscriptionPlansResource = rootResource.addResource('Get');
    const lambdaAddSubscriptionResource = rootResource.addResource('Add');
    const lambdaEdutSubscriptionPlansResource = rootResource.addResource('Edit');
    const lambdaDeleteSubscriptionPlansResource = rootResource.addResource('Delete');

    //Вывод списка
    const ListSubscriptionPlansLambda = new NodejsFunction(that, 'ListSubscriptionPlansLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionPlans', 'ListSubscriptionPlansLambda.ts'),
        handler: 'ListSubscriptionPlansHandler',
        functionName: 'react-SubscriptionPlans-List-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            botsTable: StaticEnvironment.DynamoDbTables.botsTable.name,
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
    const lambdaIntegrationListSubscriptionPlans = new apigateway.LambdaIntegration(ListSubscriptionPlansLambda);
    lambdaListSubscriptionPlansResource.addMethod('GET', lambdaIntegrationListSubscriptionPlans);

    //Вывод одного элемента
    const GetSubscriptionPlanLambda = new NodejsFunction(that, 'GetSubscriptionPlanLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionPlans', 'GetSubscriptionPlanLambda.ts'),
        handler: 'GetSubscriptionPlanHandler',
        functionName: 'react-SubscriptionPlans-Get-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            botsTable: StaticEnvironment.DynamoDbTables.botsTable.name,
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
    const lambdaIntegrationGetSubscriptionPlans = new apigateway.LambdaIntegration(GetSubscriptionPlanLambda);
    lambdaGetSubscriptionPlansResource.addMethod('GET', lambdaIntegrationGetSubscriptionPlans);

    //Добавлении типа подписки
    const AddSubscriptionPlanLambda = new NodejsFunction(that, 'AddSubscriptionPlanLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionPlans', 'AddSubscriptionPlanLambda.ts'),
        handler: 'AddSubscriptionPlanHandler',
        functionName: 'react-SubscriptionPlans-Add-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            botsTable: StaticEnvironment.DynamoDbTables.botsTable.name,
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
    const lambdaIntegrationAddSubscriptionPlan = new apigateway.LambdaIntegration(AddSubscriptionPlanLambda);
    lambdaAddSubscriptionResource.addMethod('POST', lambdaIntegrationAddSubscriptionPlan);

    //редактирование опции оплаты
    const EditSubscriptionPlanLambda = new NodejsFunction(that, 'EditSubscriptionPlanLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionPlans', 'EditSubscriptionPlanLambda.ts'),
        handler: 'EditSubscriptionPlanHandler',
        functionName: 'react-SubscriptionPlans-Edit-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            botsTable: StaticEnvironment.DynamoDbTables.botsTable.name,
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
    const lambdaIntegrationEditSubscriptionPlan = new apigateway.LambdaIntegration(EditSubscriptionPlanLambda);
    lambdaEdutSubscriptionPlansResource.addMethod('PUT', lambdaIntegrationEditSubscriptionPlan);

    //удаление опции оплаты
    const DeleteSubscriptionPlanLambda = new NodejsFunction(that, 'DeleteSubscriptionPlanLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionPlans', 'DeleteSubscriptionPlanLambda.ts'),
        handler: 'DeleteSubscriptionPlanHandler',
        functionName: 'react-SubscriptionPlans-Delete-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            botsTable: StaticEnvironment.DynamoDbTables.botsTable.name,
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
    const lambdaIntegrationDeleteSubscriptionPlan = new apigateway.LambdaIntegration(DeleteSubscriptionPlanLambda);
    lambdaDeleteSubscriptionPlansResource.addMethod('DELETE', lambdaIntegrationDeleteSubscriptionPlan);

    GrantAccessToDDB([ListSubscriptionPlansLambda, AddSubscriptionPlanLambda, EditSubscriptionPlanLambda, DeleteSubscriptionPlanLambda, GetSubscriptionPlanLambda], tables);
}
