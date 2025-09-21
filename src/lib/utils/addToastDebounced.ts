import { addToast } from "@heroui/react";
import { debounce } from "lodash";

export const addToastDebounced = debounce(addToast, 500);