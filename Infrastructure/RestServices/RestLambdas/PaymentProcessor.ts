import { CfnOutput, Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ILayerVersion, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as StaticEnvironment from '../../../../Core/ReadmeAndConfig/StaticEnvironment';
import * as DynamicEnvironment from '../../../../Core/ReadmeAndConfig/DynamicEnvironment';
import { GrantAccessToDDB } from '/opt/DevHelpers/AccessHelper';

import { Effect, IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export function PaymentProcessor(that: any, layers: ILayerVersion[], lambdaRole: IRole) {
    const ToggleUserBlockedStatusFifoQueue = Queue.fromQueueArn(that, 'imported-ToggleUserBlockedStatusFifoQueue-PaymentProcessor', DynamicEnvironment.SQS.ToggleUserBlockedStatusFifo.basicSQS_arn);

    const notificationsQueue = Queue.fromQueueArn(that, 'imported-notificationsQueue-ForPaymentProcessor', DynamicEnvironment.SQS.notificationsQueue.basicSQS_arn);
    const SendMessageSchedulerQueueSecond = Queue.fromQueueArn(that, 'imported-schedulerSendQueueForPaymentProcessor', DynamicEnvironment.SQS.SendMessageSchedulerQueue.Second.basicSQS_arn);

    const paymentProcessorIncomingRequestQueueDLQ = Queue.fromQueueArn(that, 'imported-PaymentProcessorQueue', DynamicEnvironment.SQS.PaymentProcessorQueue.dlqSQS_arn);

    const paymentProcessorIncomingRequestQueue = Queue.fromQueueArn(that, 'imported-PaymentProcessorQueueDQL', DynamicEnvironment.SQS.PaymentProcessorQueue.basicSQS_arn);

    const paymentProcessorConfirmationQueueDLQ = Queue.fromQueueArn(that, 'imported-PaymentProcessorConfirmationQueue', DynamicEnvironment.SQS.PaymentProcessorConfirmationQueue.dlqSQS_arn);

    const paymentProcessorConfirmationQueue = Queue.fromQueueArn(that, 'imported-PaymentProcessorConfirmationQueueDQL', DynamicEnvironment.SQS.PaymentProcessorConfirmationQueue.basicSQS_arn);

    const SubscribeToSubscriptionPlanQueue = Queue.fromQueueArn(
        that,
        'imported-SubscribeToSubscriptionPlanQueue-forPaymentProcessor',
        DynamicEnvironment.SQS.SubscriptionProcessorQueue.SubscribeToSubscriptionPlanQueue.basicSQS_arn
    );

    const SubscribeToContentPlanQueue = Queue.fromQueueArn(
        that,
        'imported-SubscribeToContentPlanQueue-forPaymentProcessor',
        DynamicEnvironment.SQS.SubscriptionProcessorQueue.SubscribeToContentPlanQueue.basicSQS_arn
    );

    //Лямбда - принимает сообщение и запускает его обработку
    const paymentProcessorIncomingRequestsLambda = new NodejsFunction(that, 'paymentProcessorIncomingRequests', {
        entry: join(__dirname, '..', '..', '..', 'services', 'PaymentProcessor', 'IncomingPaymentRequests.ts'),
        handler: 'handler',
        functionName: 'paymentProcessor-incomingRequests',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.SMALL,
        role: lambdaRole,
        environment: {
            SendMessageSchedulerQueueSecondURL: SendMessageSchedulerQueueSecond.queueUrl,
            SubscribeToSubscriptionPlanQueueURL: SubscribeToSubscriptionPlanQueue.queueUrl,
            SubscribeToContentPlanQueueURL: SubscribeToContentPlanQueue.queueUrl,
            notificationsQueueURL: notificationsQueue.queueUrl,
            ToggleUserBlockedStatusQueueURL: ToggleUserBlockedStatusFifoQueue.queueUrl,

            ...StaticEnvironment.LambdaSettings.EnvironmentVariables
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    //Лямбда - принимает подтверждение или отказ от админа и запускает его обработку
    const paymentProcessorincomingConfirmationRequestRequestsLambda = new NodejsFunction(that, 'paymentProcessorConfirmationRequests', {
        entry: join(__dirname, '..', '..', '..', 'services', 'PaymentProcessor', 'IncomingPaymentConfirmation.ts'),
        handler: 'handler',
        functionName: 'paymentProcessor-IncomingPaymentConfirmation',
        runtime: StaticEnvironment.LambdaSettings.runtime,
        logRetention: StaticEnvironment.LambdaSettings.logRetention,
        timeout: StaticEnvironment.LambdaSettings.timeout.SMALL,
        role: lambdaRole,
        environment: {
            SendMessageSchedulerQueueSecondURL: SendMessageSchedulerQueueSecond.queueUrl,
            SubscribeToSubscriptionPlanQueueURL: SubscribeToSubscriptionPlanQueue.queueUrl,
            SubscribeToContentPlanQueueURL: SubscribeToContentPlanQueue.queueUrl,
            notificationsQueueURL: notificationsQueue.queueUrl,
            ToggleUserBlockedStatusQueueURL: ToggleUserBlockedStatusFifoQueue.queueUrl,
            ...StaticEnvironment.LambdaSettings.EnvironmentVariables
        },
        bundling: {
            externalModules: StaticEnvironment.LambdaSettings.externalModules
        },
        layers: layers
    });

    const eventSourceIncomingEvent = new SqsEventSource(paymentProcessorIncomingRequestQueue, {
        enabled: true,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    const eventSourceIncomingEventDlq = new SqsEventSource(paymentProcessorIncomingRequestQueueDLQ, {
        enabled: false,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    const eventSourceConfirmationEvent = new SqsEventSource(paymentProcessorConfirmationQueue, {
        enabled: true,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    const eventSourceConfirmationEventDlq = new SqsEventSource(paymentProcessorConfirmationQueueDLQ, {
        enabled: false,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    paymentProcessorIncomingRequestsLambda.addEventSource(eventSourceIncomingEvent);
    paymentProcessorIncomingRequestsLambda.addEventSource(eventSourceIncomingEventDlq);

    paymentProcessorincomingConfirmationRequestRequestsLambda.addEventSource(eventSourceConfirmationEvent);
    paymentProcessorincomingConfirmationRequestRequestsLambda.addEventSource(eventSourceConfirmationEventDlq);
}
