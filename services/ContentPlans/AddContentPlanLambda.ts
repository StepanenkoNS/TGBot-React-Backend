import { TextHelper } from '/opt/TextHelpers/textHelper';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { TelegramUserFromAuthorizer } from 'tgbot-project-types/TypesCompiled/AuthTypes';
//@ts-ignore
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore
import { ValidateIncomingEventBody, ValidateStringParameters } from '/opt/LambdaHelpers/ValidateIncomingData';
//@ts-ignore
import { ParseItemResult, ParseItemResult, ParseItemResult, ParseListResult, ParseItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';

import { ContentConfigurator } from '/opt/ContentConfigurator';

import { IContentPlan } from 'tgbot-project-types/TypesCompiled/ContentTypes';
import { PomponaSubscriptionsProcessor } from '/opt/PomponaSubscriptionsProcessor';

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    console.log(event);
    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'botId', datatype: 'number(nonZeroPositiveInteger)' },
        { key: 'name', datatype: 'string' },
        // { key: 'type', datatype: [EContentPlanType.INTERACTIVE.toString(), EContentPlanType.SCHEDULLED.toString()] },

        { key: 'description', datatype: 'string' }
    ]);
    if (bodyObject.success === false) {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'ADD',
            masterId: Number(telegramUser.id),
            data: { success: false, error: bodyObject.error },

            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    const contentPlan: IContentPlan = {
        botId: Number(TextHelper.SanitizeToDirectText(bodyObject.data.botId)),
        masterId: Number(telegramUser.id),
        name: TextHelper.SanitizeToDirectText(bodyObject.data.name),
        description: TextHelper.SanitizeToDirectText(bodyObject.data.description)
    };

    const limitsValidationResult = await PomponaSubscriptionsProcessor.CheckSubscription_AddContentPlan({
        key: {
            masterId: contentPlan.masterId,
            botId: contentPlan.botId
        },
        userJsonData: telegramUser
    });

    if (limitsValidationResult.success == false || !limitsValidationResult.data) {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'ADD',
            masterId: Number(telegramUser.id),
            data: { success: false, error: 'not valid subscription data' },

            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    if (limitsValidationResult.success == true && limitsValidationResult.data.allow == false) {
        return await ReturnRestApiResult({
            statusCode: 429,
            method: 'ADD',
            masterId: Number(telegramUser.id),
            data: { success: false, error: 'Subscription plan limits exceeded' },

            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    const result = await ContentConfigurator.AddContentPlan(contentPlan);

    const dataResult = ParseItemResult(result);

    return await ReturnRestApiResult({
        statusCode: dataResult.code,
        method: 'ADD',
        masterId: Number(telegramUser.id),
        data: dataResult.body,

        origin: origin,
        renewedAccessToken: renewedToken
    });
}
