import { isCancel, select } from "@clack/prompts";
import consola from "consola";
import { getIconSet } from "./lib/iconsets";

interface State {
  library: ReturnType<typeof getIconSet> | null;
}

interface MenuOption<T extends string> {
  value: T;
  label: string;
  when?: (state: State) => boolean;
}

async function checkCancel<T>(func: () => Promise<T>): Promise<Exclude<T, symbol>> {
  const value = await func();

  if (isCancel(value)) {
    consola.log("Operation canceled");
    process.exit(0);
  }

  return value as Exclude<T, symbol>;
}

async function selectLibrary() {
  const libSelect = await checkCancel(() =>
    select({
      message: "Select library:",
      options: [
        { value: "lucide", label: "Lucide" },
        { value: "heroicons", label: "Heroicons" },
      ] as const,
    }),
  );

  return getIconSet(libSelect);
}

type MainMenuAction = "selectLibrary" | "listVariants";

const mainMenuHandlers: Record<MainMenuAction, (state: State) => Promise<void>> = {
  selectLibrary: async (state) => {
    state.library = await selectLibrary();
  },
  listVariants: async (state) => {
    console.log(state.library?.variants);
  },
};

const mainMenuOptions: Array<MenuOption<MainMenuAction>> = [
  { value: "selectLibrary", label: "Select icon library" },
  { value: "listVariants", label: "List library variants", when: (s) => !!s.library },
];

async function mainMenu(state: State): Promise<MainMenuAction> {
  const menuOptions = mainMenuOptions.filter((o) => !o.when || o.when(state));

  const action = await checkCancel(() =>
    select<MainMenuAction>({
      message: `${state.library ? `[${state.library.name}] ` : ""}Main Menu:`,
      options: menuOptions,
    }),
  );

  return action;
}

export async function interactive() {
  const state: State = { library: null };

  while (true) {
    const action = await mainMenu(state);

    await mainMenuHandlers[action](state);
  }
}
