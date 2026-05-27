export class HttpError extends Error {

    constructor(
        requestInfo: RequestInfo | URL,
        response: Response) {
        super("HTTP Error: " + response.status);

        this.name = "HttpError";
        this.status = response.status;
    }


    public status: number;
}