import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import ReturnRestApiResult from 'services/Utils/ReturnRestApiResult';
import { ddbDocClient } from '/opt/DDB/ddbDocClient';
import { defaultMenuLanguage, ESupportedLanguages } from '/opt/ConfiguratorTypes';
import { ReturnArticlesAsArray, ReturnArticlesMapFromDB, ReturnCategoriesAsArray, ReturnCategoriesMapFromDB } from '../Utils/HCHelper';

type Page = {
    pagePath: string;
    locale: ESupportedLanguages;
    itemName?: string;
    pageId?: string;
};
const fallbackLocale = defaultMenuLanguage;

export async function GetHCArticleLambdaHandler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log(event);

    let origin = 'https://' + process.env.cookieDomain;
    if (event.headers && event.headers.origin) {
        //todo - удалить перед деплоем
        const array = process.env.allowedOrigins!.split(',');
        if (array.includes(origin)) {
            origin = event.headers.origin;
        }
    }
    let locale;
    let category: string | undefined;
    let subcategory: string | undefined;
    let article: string | undefined;
    const queryParams = event.queryStringParameters;
    if (queryParams) {
        locale = !queryParams['locale'] ? fallbackLocale : queryParams['locale'];
        category = !queryParams['category'] ? undefined : queryParams['category'];
        subcategory = !queryParams['subcategory'] ? undefined : queryParams['subcategory'];
        article = !queryParams['article'] ? undefined : queryParams['article'];
    } else {
        console.log('query params not provided');
        const returnObject = ReturnRestApiResult(422, { error: 'query params  not provided' }, false, origin);
        return returnObject as APIGatewayProxyResult;
    }

    try {
        const mapArticles = await ReturnArticlesMapFromDB(locale);
        const mapCategories = await ReturnCategoriesMapFromDB(locale, mapArticles);

        const categoriesArray = ReturnCategoriesAsArray(mapCategories, mapArticles);

        const activeCategory = categoriesArray.filter((item) => item.slug === category)[0];
        const activeSubcategory = activeCategory.subCategories.filter((item: any) => item.slug === subcategory)[0] || activeCategory.subCategories[0];
        const activeArticle = activeSubcategory.articles.filter((item: any) => item.slug === article)[0];

        const ResultObject = { activeArticle, activeSubcategory, categories: categoriesArray, articles: activeSubcategory.articles }; // { categories: categoriesArray, allArticles: articlesArray, popularArticles: popularArticlesArray };

        const returnObject = ReturnRestApiResult(200, ResultObject, true, origin);
        return returnObject as APIGatewayProxyResult;
    } catch (error) {
        console.log('DynamoDB error\n', error);
        const returnObject = ReturnRestApiResult(422, { error: 'Database error' }, false, origin);
        return returnObject as APIGatewayProxyResult;
    }
}
