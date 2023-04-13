import { SQSEvent } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import ksuid from 'ksuid';
//@ts-ignore
import { IRequestForPaymentConfirmation } from '/opt/PaymentTypes';
//@ts-ignore
import PaymentOptionsManager from '/opt/PaymentOptionsManager';
//@ts-ignore
import MessageSender from '/opt/MessageSender';
import { ETelegramUserStatus } from '/opt/MessagingBotTypes';

const sqs = new SQS({ region: process.env.region });

export async function IncomingPaymentRequestsHandler(event: SQSEvent): Promise<any> {
    const batchItemFailures: any[] = [];
    console.log('IncomingPaymentRequestsHandler - incoming event', JSON.stringify(event));
    for (const record of event.Records) {
        try {
            const request = JSON.parse(record.body) as IRequestForPaymentConfirmation;
            const addPaymentEventResult = await PaymentOptionsManager.AddDIRECTPaymentRequest(request);
            console.log('addPaymentEventResult', addPaymentEventResult);
            if (addPaymentEventResult === false) {
                batchItemFailures.push({ itemIdentifier: record.messageId });
            } else {
                //отправляем сообщение
                const item = { ...request };
                item.id = addPaymentEventResult;
                console.log('item', item);
                const sendResult = await MessageSender.SendPaymentMethodToAdmin(item);
                if (sendResult === false) {
                    batchItemFailures.push({ itemIdentifier: record.messageId });
                }
                if (sendResult === ETelegramUserStatus.THROTTLED) {
                    console.log('request throttled by telegram');
                    batchItemFailures.push({ itemIdentifier: record.messageId });
                }
                if (sendResult === ETelegramUserStatus.ERROR) {
                    console.log('Unknown error');
                    batchItemFailures.push({ itemIdentifier: record.messageId });
                }
            }

            console.log(record);
        } catch (e) {
            console.log(`Error in processing SQS consumer: ${record.body}`);
            console.log(e);
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }
    console.log('batchItemFailures', batchItemFailures);
    return { batchItemFailures };
}