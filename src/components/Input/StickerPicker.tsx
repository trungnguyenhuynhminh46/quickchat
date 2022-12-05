import { FC, Fragment, useState } from "react";

import ClickAwayListener from "../ClickAwayListener";
import { STICKERS_URL } from "../../shared/constants";
import Spin from "react-cssfx-loading/lib/Spin";
import SpriteRenderer from "../SpriteRenderer";
import { StickerCollections } from "../../shared/types";
import { useFetch } from "../../hooks/useFetch";

interface StickerPickerOpened {
  setIsOpened: (value: boolean) => void;
  onSelect: (value: string) => void;
}

const getRecentStickers = () => {
  const existing = localStorage.getItem("quickchat-recent-stickers") || "[]";
  try {
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (error) {
    return [];
  }
};

const StickerPicker: FC<StickerPickerOpened> = ({ setIsOpened, onSelect }) => {
  const { data, loading, error } = useFetch<StickerCollections>("sticker", () =>
    fetch(STICKERS_URL).then((res) => res.json())
  );

  const [recentStickers, setRecentStickers] = useState(getRecentStickers());

  const addRecentSticker = (url: string) => {
    const added = [...new Set([url, ...recentStickers])];

    localStorage.setItem("quickchat-recent-stickers", JSON.stringify(added));

    setRecentStickers(added);
  };

  return (
    <ClickAwayListener onClickAway={() => setIsOpened(false)}>
      {(ref) => (
        <div
          ref={ref}
          className="border-dark-lighten absolute -left-16 bottom-full h-96 w-96 rounded-lg border-2 bg-[#222222] shadow-2xl"
        >
          {loading || error ? (
            <div className="flex items-center justify-center w-full h-full">
              <Spin />
            </div>
          ) : (
            <div className="flex flex-col w-full h-full">
              <div className="flex-grow p-3 pt-1 overflow-y-auto">
                {recentStickers.length > 0 && (
                  <>
                    <h1 className="mt-2" id="sticker-recent">
                      Recent stickers
                    </h1>
                    <div className="grid justify-between w-full grid-cols-5">
                      {recentStickers.map((url) => (
                        <SpriteRenderer
                          size={60}
                          onClick={() => {
                            onSelect(url);
                            addRecentSticker(url);
                            setIsOpened(false);
                          }}
                          className="cursor-pointer hover:bg-dark-lighten"
                          src={url}
                          runOnHover
                        />
                      ))}
                    </div>
                  </>
                )}

                {data?.map((collection) => (
                  <Fragment key={collection.id}>
                    <h1 className="mt-2" id={`sticker-${collection.id}`}>
                      {collection.name}
                    </h1>
                    <div className="grid justify-between w-full grid-cols-5">
                      {collection.stickers.map((sticker) => (
                        <SpriteRenderer
                          key={sticker.spriteURL}
                          size={60}
                          onClick={() => {
                            onSelect(sticker.spriteURL);
                            addRecentSticker(sticker.spriteURL);
                            setIsOpened(false);
                          }}
                          className="cursor-pointer hover:bg-dark-lighten"
                          src={sticker.spriteURL}
                          runOnHover
                        />
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className="flex flex-shrink-0 w-full gap-2 p-2 overflow-x-auto border-t h-18 border-t-dark-lighten">
                {recentStickers.length > 0 && (
                  <button
                    onClick={() =>
                      document
                        .querySelector(`#sticker-recent`)
                        ?.scrollIntoView()
                    }
                    className="flex items-center h-9 w-9"
                  >
                    <i className="bx bx-time text-[26px] leading-[26px]"></i>
                  </button>
                )}
                {data?.map((collection) => (
                  <img
                    onClick={() =>
                      document
                        .querySelector(`#sticker-${collection.id}`)
                        ?.scrollIntoView()
                    }
                    className="object-cover cursor-pointer h-9 w-9"
                    src={collection.icon}
                    alt=""
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ClickAwayListener>
  );
};

export default StickerPicker;
