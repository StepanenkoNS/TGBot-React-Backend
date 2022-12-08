import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import ReturnRestApiResult from 'services/Utils/ReturnRestApiResult';
import { TelegramUserFromAuthorizer } from 'services/Utils/Types';
import { ValidateIncomingEventBody } from 'services/Utils/ValidateIncomingEventBody';
import { EPaymentTypes } from '../../../TGBot-CoreLayers/LambdaLayers/Types/PaymentTypes';
import { SetOrigin } from '../Utils/OriginHelper';
//@ts-ignore
import PaymentOptionsManager from '/opt/PaymentOptionsManager';

export async function EditPaymentOptionHandler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log(event);

    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, ['id', 'name', 'type', 'description', 'currency', 'conversionRatio']);
    if (bodyObject === false) {
        return ReturnRestApiResult(422, { error: 'Error: mailformed JSON body' }, false, origin, renewedToken);
    }

    if (bodyObject.type === EPaymentTypes.INTEGRATION) {
        bodyObject = ValidateIncomingEventBody(event, ['token']);
        if (bodyObject === false) {
            return ReturnRestApiResult(422, { error: 'Error: mailformed JSON body - token not provided' }, false, origin, renewedToken);
        }
    }
    const chatId = telegramUser.id;
    try {
        if (bodyObject.type === EPaymentTypes.INTEGRATION)
            await PaymentOptionsManager.EditPaymentMethod(chatId, bodyObject.id, {
                name: bodyObject.name,
                type: EPaymentTypes.INTEGRATION,
                token: bodyObject.token,
                currency: bodyObject.currency,
                conversionRatio: bodyObject.conversionRatio,
                description: bodyObject.description
            });
        console.log(bodyObject);
        const SK = bodyObject.id;
        if (bodyObject.type === EPaymentTypes.DIRECT)
            await PaymentOptionsManager.EditPaymentMethod(chatId, SK, {
                name: bodyObject.name,
                type: EPaymentTypes.DIRECT,
                currency: bodyObject.currency,
                conversionRatio: bodyObject.conversionRatio,
                description: bodyObject.description
            });

        const returnObject = ReturnRestApiResult(201, { success: true }, false, origin, renewedToken);
        console.log(returnObject);
        return returnObject;
    } catch (error) {
        return ReturnRestApiResult(500, { error: 'Internal server error' }, false, origin, renewedToken);
    }
}