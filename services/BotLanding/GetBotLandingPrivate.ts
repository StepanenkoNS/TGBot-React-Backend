import { TextHelper } from '/opt/TextHelpers/textHelper';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ParseItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';
import { defaultMenuLanguage, ESupportedLanguage } from 'tgbot-project-types/TypesCompiled/LocaleTypes';
import { GetLandingSubdomainFromOrigin, SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore

import { ValidateStringParameters } from '/opt/LambdaHelpers/ValidateIncomingData';

import { TelegramUserFromAuthorizer } from 'tgbot-project-types/TypesCompiled/AuthTypes';

//@ts-ignore
import { BotLanging } from '/opt/BotLanding';

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    console.log('event', JSON.stringify(event));
    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;
    const origin = SetOrigin(event);

    if (origin == '') {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'GET',
            masterId: Number(telegramUser.id),
            data: { success: false, error: 'Origin is incorrect' },

            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }

    if (!ValidateStringParameters(event, ['id'])) {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'GET',
            masterId: Number(telegramUser.id),
            data: { success: false, error: 'QueryString parameters are invald' },

            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    const botId = event.queryStringParameters!.id!;

    //const subdomain = TextHelper.SanitizeToDirectText(GetLandingSubdomainFromOrigin(event));

    const subdomain = 'pomponabot';

    const result = await BotLanging.GetBotLangingPrivate(Number(botId));
    const dataResult = ParseItemResult(result);

    return await ReturnRestApiResult({
        statusCode: dataResult.code,
        method: 'GET',
        masterId: Number(telegramUser.id),
        data: dataResult.body,

        origin: origin,
        renewedAccessToken: renewedToken
    });
}
