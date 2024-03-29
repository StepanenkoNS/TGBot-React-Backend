import { Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ILayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as StaticEnvironment from '../../../../Core/ReadmeAndConfig/StaticEnvironment';

//@ts-ignore
import { GrantAccessToDDB, GrantAccessToS3, LambdaAndResource } from '/opt/DevHelpers/AccessHelper';
import { IRole, Role } from 'aws-cdk-lib/aws-iam';

export function CreateMessageFilesLambdas(that: any, layers: ILayerVersion[], lambdaRole: IRole) {
    //добавление ресурсов в шлюз

    //Вывод списка

    const ListMessageFilesLambda = new NodejsFunction(that, 'ListMessageFilesLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'MessageFiles', 'ListMessageFilesLambda.ts'),
        handler: 'handler',
        functionName: 'react-MessageFiles-List-Lambda',
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
    const GetMessageFileLambda = new NodejsFunction(that, 'GetMessageFileLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'MessageFiles', 'GetMessageFileLambda.ts'),
        handler: 'handler',
        functionName: 'react-MessageFiles-Get-Lambda',
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
    const AddMessageFileLambda = new NodejsFunction(that, 'AddMessageFileLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'MessageFiles', 'AddMessageFileLambda.ts'),
        handler: 'handler',
        functionName: 'react-MessageFiles-Add-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.MEDIUM,
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
    const EditMessageFileLambda = new NodejsFunction(that, 'EditMessageFileLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'MessageFiles', 'EditMessageFileLambda.ts'),
        handler: 'handler',
        functionName: 'react-MessageFiles-Edit-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.MEDIUM,
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
    const DeleteMessageFileLambda = new NodejsFunction(that, 'DeleteMessageFileLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'MessageFiles', 'DeleteMessageFileLambda.ts'),
        handler: 'handler',
        functionName: 'react-MessageFiles-Delete-Lambda',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.MEDIUM,
        role: lambdaRole,
        environment: {
            ...StaticEnvironment.LambdaSettings.EnvironmentVariables
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    // GrantAccessToDDB([ListMessageFilesLambda, AddMessageFileLambda, EditMessageFileLambda, DeleteMessageFileLambda, GetMessageFileLambda], tables);

    // GrantAccessToS3(
    //     [ListMessageFilesLambda, AddMessageFileLambda, EditMessageFileLambda, DeleteMessageFileLambda, GetMessageFileLambda],
    //     [StaticEnvironment.S3.buckets.botsBucketName, StaticEnvironment.S3.buckets.tempUploadsBucketName]
    // );

    const returnArray: LambdaAndResource[] = [];
    returnArray.push({
        lambda: ListMessageFilesLambda,
        resource: 'List',
        httpMethod: 'GET'
    });
    returnArray.push({
        lambda: GetMessageFileLambda,
        resource: 'Get',
        httpMethod: 'GET'
    });
    returnArray.push({
        lambda: AddMessageFileLambda,
        resource: 'Add',
        httpMethod: 'POST'
    });

    returnArray.push({
        lambda: EditMessageFileLambda,
        resource: 'Edit',
        httpMethod: 'PUT'
    });

    returnArray.push({
        lambda: DeleteMessageFileLambda,
        resource: 'Delete',
        httpMethod: 'DELETE'
    });

    return returnArray;
}
