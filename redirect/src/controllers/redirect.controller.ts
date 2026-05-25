import { HttpError, PersistenceHttpClient, RequestWithParams } from "@url-shortner/http";

const _factory = (opts: {
    httpClient: PersistenceHttpClient,
}) => {
    const { httpClient } = opts;

    const redirect = async (req: RequestWithParams<{ shortCode: string }>, res: any) => {

        try {
            //TODO: missing writing cache here!
            const { originalUrl } = await httpClient.getOriginalUrlFromShortLink({ key: req.params.shortCode });
            return res.status(302).redirect(originalUrl);
        } catch (error) {
            if (error instanceof HttpError && error.status === 404) {
                return res.status(404).json({ error: "Not Found" });
            }

            throw error;
        }

    }

    return {
        redirect
    }
}

export default _factory;