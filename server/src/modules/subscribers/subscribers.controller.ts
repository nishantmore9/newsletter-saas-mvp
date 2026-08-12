import { Request, Response } from "express";
import SubscriberService from "./subscribers.service.js";
import { getValidatedData } from "../../utils/validateData.js";
import { DeleteSubscriberInput,GetSubscribersInput,SubscriberInput} from "./subscribers.schema.js";

const SubscribeController = {
  create: async(req: Request, res: Response): Promise<void> => {
    const { params, body } = getValidatedData<SubscriberInput>(req);
    const { publicationId } = params;
    const { email, name, hp_field } = body;

    // silent rejection for bot submissions
    if(hp_field){
      // fake success response for bots
      res.status(201).json({
        status: "success",
        message: "Subscribed successfully!",
      });
      return;
    }

    const subscriber = await SubscriberService.create({ publicationId, email, name });

    res.status(201).json({
      status: "success",
      message: "Subscribed successfully!",
      data: {
        email: subscriber?.email,
        status: subscriber?.status,
      },
    });

  },
  getByPublicationId: async(req: Request, res: Response): Promise<void> => {
    const { params, query } = getValidatedData<GetSubscribersInput>(req);
    const { publicationId } = params;
    const { page, limit } = query;

    const subscribers = await SubscriberService.getByPublicationId(publicationId, page, limit);

    res.status(200).json({
      status: "success",
      data: subscribers,
    });

  },
  deleteById: async(req: Request, res: Response): Promise<void> => {
    const { params } = getValidatedData<DeleteSubscriberInput>(req);
    const { subscriberId } = params;

    await SubscriberService.deleteById(subscriberId);

    res.status(200).json({
      status: "success",
      message: "Subscriber deleted successfully!",
    });
  }
};

export default SubscribeController;