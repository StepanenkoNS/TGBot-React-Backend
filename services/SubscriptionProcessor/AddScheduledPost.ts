import { TextHelper } from '/opt/TextHelpers/textHelper';
import { SQSEvent } from 'aws-lambda';

//@ts-ignore
import { MessagingBotSubscriptionManager } from '/opt/MessagingBotSubscriptionManager';

import { PostTrigger } from 'tgbot-project-types/TypesCompiled/ContentTypesPrimitives';

export async function handler(event: SQSEvent): Promise<any> {
    const batchItemFailures: any[] = [];
    console.log('IncomingEvent', JSON.stringify(event));
    for (const record of event.Records) {
        try {
            //console.log('record', record);

            const request = JSON.parse(record.body) as { masterId: number; botId: number; contentPlanId: string; contentPlanPostId: string; trigger: PostTrigger };

            const data = { masterId: request.masterId, botId: request.botId, contentPlanId: request.contentPlanId, contentPlanPostId: request.contentPlanPostId, trigger: request.trigger };

            const addScheduledPostResult = await MessagingBotSubscriptionManager.Scheduleler_SheduleNewPost(data);

            if (addScheduledPostResult === false) {
                console.log('Error in addScheduledPostResult', data);
                batchItemFailures.push({ itemIdentifier: record.messageId });
            }
        } catch (error) {
            console.log('Error in processing SQS consumer: ${record.body}', error);
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }
    console.log('batchItemFailures', batchItemFailures);
    return { batchItemFailures };
}
