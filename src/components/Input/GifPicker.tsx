import { FC, useRef, useState } from "react";

import ClickAwayListener from "../ClickAwayListener";
import Spin from "react-cssfx-loading/lib/Spin";
import configs from "../../shared/configs";
import { useFetch } from "../../hooks/useFetch";

interface GifPickerProps {
  setIsOpened: (value: boolean) => void;
  onSelect: (gif: any) => void;
}

const GifPicker: FC<GifPickerProps> = ({ setIsOpened, onSelect }) => {
  const [searchInputValue, setSearchInputValue] = useState("");

  const timeOutRef = useRef<any>(null);

  const { data, loading, error } = useFetch(`giphy-${searchInputValue}`, () =>
    fetch(
      searchInputValue.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${
            configs.giphyAPIKey
          }&q=${encodeURIComponent(searchInputValue.trim())}`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${configs.giphyAPIKey}`
    ).then((res) => res.json())
  );

  return (
    <ClickAwayListener onClickAway={() => setIsOpened(false)}>
      {(ref) => (
        <div
          ref={ref}
          className="border-dark-lighten absolute left-[-92px] bottom-full flex h-96 w-96 flex-col items-stretch rounded-lg border-2 bg-[#222222] p-4 shadow-2xl"
        >
          <div className="relative">
            <input
              onChange={(e) => {
                if (timeOutRef.current) clearTimeout(timeOutRef.current);
                timeOutRef.current = setTimeout(() => {
                  setSearchInputValue(e.target.value);
                }, 500);
              }}
              type="text"
              className="w-full py-2 pl-10 pr-4 rounded-full outline-none bg-dark-lighten"
              placeholder="Search..."
            />
            <i className="absolute text-xl -translate-y-1/2 bx bx-search top-1/2 left-3"></i>
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-grow">
              <Spin />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center flex-grow">
              <p className="text-center">
                Sorry... Giphy has limited the request
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap flex-grow gap-2 mt-3 overflow-y-auto">
              {(data as any).data.map((item: any) => (
                <img
                  key={item.id}
                  onClick={() => {
                    onSelect(item?.images?.original?.url);
                    setIsOpened(false);
                  }}
                  className="h-[100px] flex-1 cursor-pointer object-cover"
                  src={item?.images?.original?.url}
                  alt=""
                />
              ))}
            </div>
          )}
        </div>
      )}
    </ClickAwayListener>
  );
};

export default GifPicker;
