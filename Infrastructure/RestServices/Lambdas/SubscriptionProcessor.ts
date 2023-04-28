import { CfnOutput, Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ILayerVersion, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as StaticEnvironment from '../../../../ReadmeAndConfig/StaticEnvironment';
import * as DynamicEnvironment from '../../../../ReadmeAndConfig/DynamicEnvironment';
import { GrantAccessToDDB, GrantAccessToS3, ReturnGSIs } from '/opt/DevHelpers/AccessHelper';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { DeduplicationScope, FifoThroughputLimit, Queue } from 'aws-cdk-lib/aws-sqs';
import { DynamoEventSource, SqsDlq, SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export function CreateSubscriptionProcessor(that: any, layers: ILayerVersion[], tables: ITable[]) {
    const schedulerSendQueue = Queue.fromQueueArn(that, 'imported-schedulerSendQueueForCreateSubscriptionProcessor', DynamicEnvironment.SQS.SchedulerQueue.basicSQS_arn);

    const SubscribeToSubscriptionPlanQueue = Queue.fromQueueArn(
        that,
        'imported-SubscribeToSubscriptionPlanQueue-CreateSubscriptionProcessor',
        DynamicEnvironment.SQS.SubscriptionProcessorQueue.SubscribeToSubscriptionPlanQueue.basicSQS_arn
    );

    const SubscribeToSubscriptionPlanQueueDLQ = Queue.fromQueueArn(
        that,
        'imported-SubscribeToSubscriptionPlanQueueDLQ-CreateSubscriptionProcessor',
        DynamicEnvironment.SQS.SubscriptionProcessorQueue.SubscribeToContentPlanQueue.dlqSQS_arn
    );

    const SubscribeToContentPlanQueue = Queue.fromQueueArn(
        that,
        'imported-SubscribeToContentPlanQueue-CreateSubscriptionProcessor',
        DynamicEnvironment.SQS.SubscriptionProcessorQueue.SubscribeToContentPlanQueue.basicSQS_arn
    );

    const SubscribeToContentPlanQueueDLQ = Queue.fromQueueArn(
        that,
        'imported-SubscribeToContentPlanQueueDLQ-CreateSubscriptionProcessor',
        DynamicEnvironment.SQS.SubscriptionProcessorQueue.SubscribeToSubscriptionPlanQueue.dlqSQS_arn
    );

    //SubscriptionProcessorQueueURL

    //Лямбда - принимает сообщение с планом подписки и выполняет его обработку
    const SubscriptionProcessorContentPlanLambda = new NodejsFunction(that, 'SubscriptionProcessorLambdaContentPlanLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionProcessor', 'SubscribeUserToContentPlan.ts'),
        handler: 'handler',
        functionName: 'subscriptionProcessor-Subscribe-User-To-ContentPlan',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.MAX,
        environment: {
            schedulerSendQueueURL: schedulerSendQueue.queueUrl,
            SubscribeToContentPlanQueueURL: SubscribeToContentPlanQueue.queueUrl,
            SubscribeToSubscriptionPlanQueueURL: SubscribeToSubscriptionPlanQueue.queueUrl,

            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    const SubscriptionProcessorSubscriptionPlanLambda = new NodejsFunction(that, 'SubscriptionProcessorSubscriptionPlanLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionProcessor', 'SubscribeUserToSubscriptionPlan.ts'),
        handler: 'handler',
        functionName: 'subscriptionProcessor-Subscribe-User-To-SubscriptionPlan',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.MAX,
        environment: {
            schedulerSendQueueURL: schedulerSendQueue.queueUrl,
            SubscribeToContentPlanQueueURL: SubscribeToContentPlanQueue.queueUrl,
            SubscribeToSubscriptionPlanQueueURL: SubscribeToSubscriptionPlanQueue.queueUrl,

            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    const statementSQS = new PolicyStatement({
        resources: [schedulerSendQueue.queueArn],
        actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
        effect: Effect.ALLOW
    });

    SubscriptionProcessorContentPlanLambda.addToRolePolicy(statementSQS);
    SubscriptionProcessorSubscriptionPlanLambda.addToRolePolicy(statementSQS);

    const eventSourceSubscriptionIncomingEvent = new SqsEventSource(SubscribeToSubscriptionPlanQueue, {
        enabled: true,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    const eventSourceSubscriptionIncomingEventDlq = new SqsEventSource(SubscribeToSubscriptionPlanQueueDLQ, {
        enabled: false,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    SubscriptionProcessorSubscriptionPlanLambda.addEventSource(eventSourceSubscriptionIncomingEvent);
    SubscriptionProcessorSubscriptionPlanLambda.addEventSource(eventSourceSubscriptionIncomingEventDlq);

    const eventSourceContentIncomingEvent = new SqsEventSource(SubscribeToContentPlanQueue, {
        enabled: true,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    const eventSourceContentIncomingEventDlq = new SqsEventSource(SubscribeToContentPlanQueueDLQ, {
        enabled: false,
        reportBatchItemFailures: true,
        batchSize: 1
    });

    SubscriptionProcessorContentPlanLambda.addEventSource(eventSourceContentIncomingEvent);
    SubscriptionProcessorContentPlanLambda.addEventSource(eventSourceContentIncomingEventDlq);

    const CleanupChannelLambda = new NodejsFunction(that, 'CleanupChannelLambda', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionProcessor', 'SubscriptionCleanUpChannelProcessor.ts'),
        handler: 'handler',
        functionName: 'subscriptionProcessor-Cleanup-Channels',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.MAX,
        reservedConcurrentExecutions: 1,
        environment: {
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    const eventRuleChannels: events.Rule = new events.Rule(that, 'oneHourCleanupChannels', {
        schedule: events.Schedule.rate(Duration.hours(24)),
        ruleName: 'oneHourCleanupChannels'
    });

    eventRuleChannels.addTarget(
        new targets.LambdaFunction(CleanupChannelLambda, {
            event: events.RuleTargetInput.fromObject({ message: 'Hello Lambda' })
        })
    );
    targets.addLambdaPermission(eventRuleChannels, CleanupChannelLambda);

    const ZuzonaSubscriptionCleanUpProcessor = new NodejsFunction(that, 'ZuzonaSubscriptionCleanUpProcessor', {
        entry: join(__dirname, '..', '..', '..', 'services', 'SubscriptionProcessor', 'ZuzonaSubscriptionCleanUpProcessor.ts'),
        handler: 'handler',
        functionName: 'subscriptionProcessor-Cleanup-Zuzona',
        runtime: StaticEnvironment.LambdaSettinds.runtime,
        logRetention: StaticEnvironment.LambdaSettinds.logRetention,
        timeout: StaticEnvironment.LambdaSettinds.timeout.MAX,
        reservedConcurrentExecutions: 1,
        environment: {
            ...StaticEnvironment.LambdaSettinds.EnvironmentVariables
        },
        bundling: {
            externalModules: ['aws-sdk', '/opt/*']
        },
        layers: layers
    });

    const eventRuleZuzona: events.Rule = new events.Rule(that, 'oneHourCleanupZuzona', {
        schedule: events.Schedule.rate(Duration.hours(24)),
        ruleName: 'oneHourCleanupZuzona'
    });

    eventRuleZuzona.addTarget(
        new targets.LambdaFunction(ZuzonaSubscriptionCleanUpProcessor, {
            event: events.RuleTargetInput.fromObject({ message: 'oneHourCleanupZuzona' })
        })
    );
    targets.addLambdaPermission(eventRuleZuzona, ZuzonaSubscriptionCleanUpProcessor);

    GrantAccessToDDB([CleanupChannelLambda, SubscriptionProcessorContentPlanLambda, SubscriptionProcessorSubscriptionPlanLambda, ZuzonaSubscriptionCleanUpProcessor], tables);
    //     GrantAccessToS3([SubscriptionProcessorLambda], [StaticEnvironment.S3.buckets.botsBucketName, StaticEnvironment.S3.buckets.tempUploadsBucketName]);
}
