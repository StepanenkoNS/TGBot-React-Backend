import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ILayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as StaticEnvironment from '../../../../Core/ReadmeAndConfig/StaticEnvironment';
import * as DynamicEnvironment from '../../../../Core/ReadmeAndConfig/DynamicEnvironment';
import { GrantAccessToDDB, LambdaAndResource } from '/opt/DevHelpers/AccessHelper';
import { PolicyStatement, Effect, IRole } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';

export function CreateUserSubscriptionPlansChannelsLambdas(that: any, layers: ILayerVersion[], lambdaRole: IRole) {
    //Вывод списка
    const ListUserSubscriptionPlansChannelsLambda = new NodejsFunction(that, 'ListUserSubscriptionPlansChannelsLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'UserSubscriptionPlansChannel', 'ListUserSubscriptionPlansLambda.ts'),
        handler: 'handler',
        functionName: 'react-UserSubscriptionPlansChannel-List-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.SHORT,
        role: lambdaRole,
        environment: {
            ...StaticEnvironment.LambdaSettings.EnvironmentVariables
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    //Вывод одного элемента
    const GetSubscriptionPlanChannelLambda = new NodejsFunction(that, 'GetSubscriptionPlanChannelLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'UserSubscriptionPlansChannel', 'GetUserSubscriptionPlanLambda.ts'),
        handler: 'handler',
        functionName: 'react-UserSubscriptionPlansChannel-Get-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.SHORT,
        role: lambdaRole,
        environment: {
            ...StaticEnvironment.LambdaSettings.EnvironmentVariables
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    //Добавлении типа подписки
    const AddSubscriptionPlanChannelLambda = new NodejsFunction(that, 'AddSubscriptionPlanChannelLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'UserSubscriptionPlansChannel', 'AddUserSubscriptionPlanLambda.ts'),
        handler: 'handler',
        functionName: 'react-UserSubscriptionPlansChannel-Add-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.SHORT,
        role: lambdaRole,
        environment: {
            ...StaticEnvironment.LambdaSettings.EnvironmentVariables
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    //редактирование опции оплаты
    const EditSubscriptionPlanChannelLambda = new NodejsFunction(that, 'EditSubscriptionPlanChannelLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'UserSubscriptionPlansChannel', 'EditUserSubscriptionPlanLambda.ts'),
        handler: 'handler',
        functionName: 'react-UserSubscriptionPlansChannel-Edit-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.SHORT,
        role: lambdaRole,
        environment: {
            ...StaticEnvironment.LambdaSettings.EnvironmentVariables
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    //удаление опции оплаты
    const DeleteSubscriptionPlanChannelLambda = new NodejsFunction(that, 'DeleteSubscriptionPlanChannelLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'UserSubscriptionPlansChannel', 'DeleteUserSubscriptionPlanLambda.ts'),
        handler: 'handler',
        functionName: 'react-UserSubscriptionPlansChannel-Delete-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.SHORT,
        role: lambdaRole,
        environment: {
            ...StaticEnvironment.LambdaSettings.EnvironmentVariables,
            CascadeDeleteTopic: DynamicEnvironment.SNS.CascadeDeleteTopicARN
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    // DeleteSubscriptionPlanChannelLambda.addToRolePolicy(statementSQSCascadeDeleteQueue);

    // GrantAccessToDDB(
    //     [ListUserSubscriptionPlansChannelsLambda, AddSubscriptionPlanChannelLambda, EditSubscriptionPlanChannelLambda, DeleteSubscriptionPlanChannelLambda, GetSubscriptionPlanChannelLambda],
    //     tables
    // );

    const returnArray: LambdaAndResource[] = [];
    returnArray.push({
        lambda: ListUserSubscriptionPlansChannelsLambda,
        resource: 'List',
        httpMethod: 'GET'
    });
    returnArray.push({
        lambda: GetSubscriptionPlanChannelLambda,
        resource: 'Get',
        httpMethod: 'GET'
    });
    returnArray.push({
        lambda: AddSubscriptionPlanChannelLambda,
        resource: 'Add',
        httpMethod: 'POST'
    });

    returnArray.push({
        lambda: EditSubscriptionPlanChannelLambda,
        resource: 'Edit',
        httpMethod: 'PUT'
    });

    returnArray.push({
        lambda: DeleteSubscriptionPlanChannelLambda,
        resource: 'Delete',
        httpMethod: 'DELETE'
    });

    return returnArray;
}
