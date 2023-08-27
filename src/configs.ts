import { MediaPipeFaceMeshMediaPipeModelConfig } from "@tensorflow-models/face-landmarks-detection";

export interface ApplicationConfig {
  refineLandmarks: boolean;
  faceOvalColor: string;
  eyebrowColor: string;
  eyeColor: string;
  lipsColor: string;
  dotsColor: string;
  irisColor: string;
}

export interface ApplicationConfigEntry {
  formHtmlElement: Element;
  qualifiedName: string;
  value: unknown;
}

export const defaultConfig: ApplicationConfig = {
  refineLandmarks: false,
  irisColor: "#ffffff",
  dotsColor: "#ffffff",
  lipsColor: "#ffffff",
  eyeColor: "#ffffff",
  eyebrowColor: "#ffffff",
  faceOvalColor: "#ffffff",
};

export const CONFIG_TO_FEATURE_NAME_MAP: Record<
  string,
  keyof Omit<ApplicationConfig, "refineLandmarks">
> = {
  faceOval: "faceOvalColor",
  lips: "lipsColor",
  rightEyebrow: "eyebrowColor",
  leftEyebrow: "eyebrowColor",
  rightIris: "irisColor",
  leftIris: "irisColor",
  rightEye: "eyeColor",
  leftEye: "eyeColor",
};

export const DETECTOR_CONFIG: MediaPipeFaceMeshMediaPipeModelConfig = {
  runtime: "mediapipe",
  refineLandmarks: false,
  solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/",
};

const LS_KEY = "detectorConfig";

export function initializeAppConfig(htmlFormElement: HTMLFormElement) {
  const savedAppConfig = window.localStorage.getItem(LS_KEY);
  const appConfig = (
    savedAppConfig ? JSON.parse(savedAppConfig) : defaultConfig
  ) as ApplicationConfig;

  if (savedAppConfig) {
    setConfigToForm(htmlFormElement, appConfig);
  }

  return appConfig;
}

export function saveAppConfig(
  window: Window,
  htmlConfigFormElement: HTMLFormElement,
  detectorConfig: MediaPipeFaceMeshMediaPipeModelConfig
) {
  // @ts-ignore
  window.saveConfig = () => {
    const config: Record<string, string | boolean> = {};
    const formData = new FormData(htmlConfigFormElement);

    formData.forEach((value, key) => {
      if ("refineLandmarks" === key) {
        config[key] = value === "true";

        return;
      }

      config[key] = value.toString();
    });

    window.localStorage.setItem(
      LS_KEY,
      JSON.stringify({ ...detectorConfig, ...config })
    );

    console.log({ ...detectorConfig, ...config });

    window.location.reload();
  };
}

function setConfigToForm(
  formElement: HTMLFormElement,
  config: ApplicationConfig
) {
  const [refineLandmarksConfig, ...colorsConfigs] = [
    {
      formHtmlElement: formElement.elements[0],
      qualifiedName: "checked",
      value: config.refineLandmarks,
    },
    {
      formHtmlElement: formElement.elements[1],
      qualifiedName: "value",
      value: config.faceOvalColor,
    },
    {
      formHtmlElement: formElement.elements[2],
      qualifiedName: "value",
      value: config.eyebrowColor,
    },
    {
      formHtmlElement: formElement.elements[3],
      qualifiedName: "value",
      value: config.eyeColor,
    },
    {
      formHtmlElement: formElement.elements[4],
      qualifiedName: "value",
      value: config.lipsColor,
    },
    {
      formHtmlElement: formElement.elements[5],
      qualifiedName: "value",
      value: config.dotsColor,
    },
    {
      formHtmlElement: formElement.elements[6],
      qualifiedName: "value",
      value: config.irisColor,
    },
  ] as ApplicationConfigEntry[];

  const { formHtmlElement, qualifiedName, value } = refineLandmarksConfig;

  if (value) {
    formHtmlElement.setAttribute(qualifiedName, "");
  } else {
    formHtmlElement.removeAttribute(qualifiedName);
  }

  colorsConfigs.forEach(({ formHtmlElement, qualifiedName, value }) =>
    formHtmlElement.setAttribute(qualifiedName, `${value}`)
  );
}
