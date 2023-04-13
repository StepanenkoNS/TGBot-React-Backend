import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ParseUpdateItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';
import { defaultMenuLanguage, ESupportedLanguages } from '/opt/LocaleTypes';
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore

import { ValidateIncomingEventBody } from '/opt/LambdaHelpers/ValidateIncomingData';
import { TelegramUserFromAuthorizer } from '/opt/AuthTypes';
import BotLanging from '/opt/BotLanding';
import { IBotLanding } from '/opt/BotLandingTypes';

export async function UpdateBotLandingHandler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    console.log(JSON.stringify(event));
    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'botId', datatype: 'number(nonZeroPositiveInteger)' },
        { key: 'body', datatype: 'string' },
        { key: 'subdomain', datatype: 'string' },
        { key: 'title', datatype: 'string' }
    ]);
    if (bodyObject === false) {
        return ReturnRestApiResult(422, { success: false, error: 'Error: mailformed JSON body' }, false, origin, renewedToken);
    }

    const botLanding: IBotLanding = {
        discriminator: 'IBotLanding',
        masterId: Number(telegramUser.id),
        botId: Number(bodyObject.botId),
        body: bodyObject.body,
        subdomain: bodyObject.subdomain,
        title: bodyObject.title
    };
    const result = await BotLanging.UpdateBotLanging(botLanding);

    const updateResult = ParseUpdateItemResult(result);

    return ReturnRestApiResult(updateResult.code, updateResult.body, false, origin, renewedToken);
}