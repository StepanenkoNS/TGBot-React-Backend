import { Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ILayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as StaticEnvironment from '../../../../ReadmeAndConfig/StaticEnvironment';
import { GrantAccessToDDB } from '/opt/DevHelpers/AccessHelper';
import { LambdaAndResource } from '../Helper/GWtypes';

export function CreateDigitalStoreItems(that: any, layers: ILayerVersion[], tables: ITable[]) {
    //добавление ресурсов в шлюз

    //Вывод списка
    const ListDigitalStoreItemsLambda = new NodejsFunction(that, 'ListDigitalStoreItemsLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'DigitalStore', 'Item', 'ListDigitalStoreItemsLambda.ts'),
        handler: 'handler',
        functionName: 'react-DigitalStoreItems-List-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    //Вывод одного элемента
    const GetDigitalStoreItemLambda = new NodejsFunction(that, 'GetDigitalStoreItemLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'DigitalStore', 'Item', 'GetDigitalStoreItemLambda.ts'),
        handler: 'handler',
        functionName: 'react-DigitalStoreItems-Get-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    //Добавление
    const AddDigitalStoreItemLambda = new NodejsFunction(that, 'AddDigitalStoreItemLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'DigitalStore', 'Item', 'AddDigitalStoreItemLambda.ts'),
        handler: 'handler',
        functionName: 'react-DigitalStoreItems-Add-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    //редактирование
    const EditDigitalStoreItemLambda = new NodejsFunction(that, 'EditDigitalStoreItemLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'DigitalStore', 'Item', 'EditDigitalStoreItemLambda.ts'),
        handler: 'handler',
        functionName: 'react-DigitalStoreItems-Edit-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    //удаление
    const DeleteDigitalStoreItemLambda = new NodejsFunction(that, 'DeleteDigitalStoreItemLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'DigitalStore', 'Item', 'DeleteDigitalStoreItemLambda.ts'),
        handler: 'handler',
        functionName: 'react-DigitalStoreItems-Delete-Lambda',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.SHORT,
        environment: {
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    //предоставление доступа

    GrantAccessToDDB([ListDigitalStoreItemsLambda, AddDigitalStoreItemLambda, EditDigitalStoreItemLambda, DeleteDigitalStoreItemLambda, GetDigitalStoreItemLambda], tables);

    const returnArray: LambdaAndResource[] = [];
    returnArray.push({
        lambda: ListDigitalStoreItemsLambda,
        resource: 'List',
        httpMethod: 'GET'
    });
    returnArray.push({
        lambda: GetDigitalStoreItemLambda,
        resource: 'Get',
        httpMethod: 'GET'
    });
    returnArray.push({
        lambda: AddDigitalStoreItemLambda,
        resource: 'Add',
        httpMethod: 'POST'
    });

    returnArray.push({
        lambda: EditDigitalStoreItemLambda,
        resource: 'Edit',
        httpMethod: 'PUT'
    });

    returnArray.push({
        lambda: DeleteDigitalStoreItemLambda,
        resource: 'Delete',
        httpMethod: 'DELETE'
    });

    return returnArray;
}