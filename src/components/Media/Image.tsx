import { FC, useState } from "react";
import { collection, orderBy, query, where } from "firebase/firestore";

import ImageView from "../ImageView";
import Spin from "react-cssfx-loading/lib/Spin";
import { db } from "../../shared/firebase";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useParams } from "react-router-dom";

const ImageItem: FC<{ src: string }> = ({ src }) => {
  const [isImageViewOpened, setIsImageViewOpened] = useState(false);

  return (
    <>
      <img
        onClick={() => setIsImageViewOpened(true)}
        className="h-[100px] w-[100px] cursor-pointer object-cover transition duration-300 hover:brightness-75"
        src={src}
        alt=""
      />
      <ImageView
        src={src}
        isOpened={isImageViewOpened}
        setIsOpened={setIsImageViewOpened}
      />
    </>
  );
};

const Image: FC = () => {
  const { id: conversationId } = useParams();

  const { data, loading, error } = useCollectionQuery(
    `images-${conversationId}`,
    query(
      collection(db, "conversations", conversationId as string, "messages"),
      where("type", "==", "image"),
      orderBy("createdAt", "desc")
    )
  );

  if (loading || error)
    return (
      <div className="flex items-center justify-center h-80">
        <Spin />
      </div>
    );

  if (data?.empty)
    return (
      <div className="py-3 h-80">
        <p className="text-center">No image found</p>
      </div>
    );

  return (
    <div className="flex flex-wrap content-start gap-4 p-4 overflow-x-hidden overflow-y-auto h-80">
      {data?.docs.map((image) => (
        <ImageItem key={image.id} src={image.data().content} />
      ))}
    </div>
  );
};

export default Image;
