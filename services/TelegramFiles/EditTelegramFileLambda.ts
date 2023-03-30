import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TelegramUserFromAuthorizer } from '/opt/AuthTypes';
//@ts-ignore
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore
import { ValidateIncomingEventBody, ValidateStringParameters } from '/opt/LambdaHelpers/ValidateIncomingData';
//@ts-ignore
import { ParseListItemsResult, ParseUpdateItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';
//@ts-ignore
import FileTelegramConfigurator from '/opt/FileTelegramConfigurator';

export async function EditTelegramFileHandler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log(event);
    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'botId', datatype: 'number(nonZeroPositiveInteger)' },
        { key: 'id', datatype: 'string' },
        { key: 'name', datatype: 'string' },
        { key: 'tags', datatype: 'array' }
    ]);
    if (bodyObject === false) {
        return ReturnRestApiResult(422, { success: false, error: 'Error: mailformed JSON body' }, false, origin, renewedToken);
    }

    const messageFile = {
        masterId: telegramUser.id,
        botId: Number(bodyObject.botId),
        id: bodyObject.id,
        name: bodyObject.name,
        tags: bodyObject.tags
    };
    //если указан s3Key - то будем менять старый файл
    const result = await FileTelegramConfigurator.UpdateTelegramFile(messageFile);

    const updateResult = ParseUpdateItemResult(result);

    return ReturnRestApiResult(updateResult.code, updateResult.body, false, origin, renewedToken);
}
