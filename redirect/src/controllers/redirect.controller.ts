const _factory = () => {

    const redirect = async (req: any, res: any) => {
        return res.status(200);
    }

    return {
        redirect
    }
}

export default _factory;