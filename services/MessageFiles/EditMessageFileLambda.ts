import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ParseUpdateItemResult, ReturnRestApiResult } from 'services/Utils/ReturnRestApiResult';
import { TelegramUserFromAuthorizer } from '/opt/AuthTypes';
import { ValidateIncomingEventBody } from 'services/Utils/ValidateIncomingData';

import { SetOrigin } from '../Utils/OriginHelper';
//@ts-ignore
import ContentConfigurator from '/opt/ContentConfigurator';
//@ts-ignore
import { EMessageFileType } from '/opt/ContentTypes';
import BotManager from '/opt/BotManager';

export async function EditMessageFileHandler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log(event);
    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'id', datatype: 'string' },
        { key: 'name', datatype: 'string' },
        { key: 's3key', datatype: 'string' },
        { key: 'originalFileName', datatype: 'string' },
        { key: 'fileSize', datatype: 'number(positiveInteger)' },
        { key: 'tags', datatype: 'array' }
    ]);
    if (bodyObject === false) {
        return ReturnRestApiResult(422, { success: false, error: 'Error: mailformed JSON body' }, false, origin, renewedToken);
    }

    //если указан s3Key - то будем менять старый файл
    const result = await ContentConfigurator.UpdateMessageFile({
        chatId: telegramUser.id,
        messageFile: { id: bodyObject.id, name: bodyObject.name, s3key: bodyObject.s3key, originalFileName: bodyObject.originalFileName, fileSize: bodyObject.fileSize, tags: bodyObject.tags }
    });

    if (result !== undefined && result !== false) {
        const botManager = await BotManager.GetOrCreate({
            chatId: telegramUser.id,
            userName: telegramUser.username
        });
        const validateLimits = await botManager.UpdateSubscriptionLimit({
            resourceConsumption_mediaFiles: result.newFileSize - result.oldFileSize
        });
    }

    const updateResult = ParseUpdateItemResult(result);

    return ReturnRestApiResult(updateResult.code, updateResult.body, false, origin, renewedToken);
}
