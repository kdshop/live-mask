import "./style.css";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import {
  SupportedModels,
  createDetector,
  MediaPipeFaceMeshMediaPipeModelConfig,
  FaceLandmarksDetector,
  Face,
  util,
  Keypoint,
} from "@tensorflow-models/face-landmarks-detection";

import * as THREE from "three";
import { Line, Object3D, Points } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  ApplicationConfig,
  CONFIG_TO_FEATURE_NAME_MAP,
  DETECTOR_CONFIG,
  initializeAppConfig,
  saveAppConfig,
} from "./configs";
import { BoundingBox } from "@tensorflow-models/face-landmarks-detection/dist/shared/calculators/interfaces/shape_interfaces";

const model = SupportedModels.MediaPipeFaceMesh;
const htmlVideoElement = <HTMLVideoElement>document.getElementById("video");
const htmlCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
const htmlConfigFormElement = <HTMLFormElement>document.getElementById("form");

// Start app if browser supports required features
if (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
  startApp();
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Main App function
async function startApp() {
  const appConfig = initializeAppConfig(htmlConfigFormElement);
  const combinedDetectorConfig: MediaPipeFaceMeshMediaPipeModelConfig = {
    ...DETECTOR_CONFIG,
    refineLandmarks: appConfig.refineLandmarks,
  };
  saveAppConfig(window, htmlConfigFormElement, combinedDetectorConfig);

  const detector = await createDetector(model, combinedDetectorConfig);
  const animationLoop = setupThreeJs();

  navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
    htmlVideoElement.srcObject = stream;
    htmlVideoElement.addEventListener("loadeddata", () =>
      animationLoop(detector, appConfig)
    );
  });
}

// Initialize 3D library
function setupThreeJs() {
  const scene = new THREE.Scene();

  scene.add(new THREE.AxesHelper(5));
  scene.add(new THREE.AmbientLight("#ffffff", 50));

  const sizes = {
    width: htmlVideoElement.getBoundingClientRect().width,
    height: htmlVideoElement.getBoundingClientRect().height,
  };

  // Camera
  const camera = new THREE.PerspectiveCamera(
    50,
    sizes.width / sizes.height,
    0.01,
    200
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: htmlCanvasElement,
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const tick = async (
    detector: FaceLandmarksDetector,
    config: ApplicationConfig
  ) => {
    controls.update();

    const predictions = await detector.estimateFaces(htmlVideoElement);
    const prediction = predictions[0];

    scene.clear();

    if (prediction) {
      scene.add(...getFaceFeatures(prediction, config));
    }

    renderer.render(scene, camera);

    window.requestAnimationFrame(() => tick(detector, config));
  };

  return tick;
}

function getFaceFeatures(face: Face, config: ApplicationConfig): Object3D[] {
  const keypointIndex = util.getKeypointIndexByContour(model);
  const keypointsReserved = Object.values(keypointIndex).flat();
  const facePoints = face.keypoints.filter(
    (_, index) => !keypointsReserved.includes(index)
  );

  const faceDots = create3dObjectFromKeypoints(
    facePoints,
    config.dotsColor,
    THREE.Points,
    face?.box || []
  );

  const features = Object.entries(keypointIndex).map(
    ([feature, featureIndexPoints]) => {
      const featureKeypoints = featureIndexPoints
        .map((value) => face?.keypoints[value])
        .filter(Boolean);

      return create3dObjectFromKeypoints(
        featureKeypoints,
        config[CONFIG_TO_FEATURE_NAME_MAP[feature]] || config.dotsColor,
        THREE.Line,
        face?.box || []
      );
    }
  );

  return [faceDots, ...features];
}

function create3dObjectFromKeypoints(
  keypoints: Keypoint[],
  color: string,
  typeOfObjectToDraw: typeof Line | typeof Points,
  boundingBox: BoundingBox
): Object3D {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    keypoints?.map(
      ({ x, y, z }) =>
        new THREE.Vector3(
          (x - htmlVideoElement.width / 2.1 - boundingBox.width / 18) / 10,
          (y - htmlVideoElement.height / 2.1 - boundingBox.height / 20) / 10,
          (z || 0) / 10
        )
    ) || []
  );

  const obj3D = new typeOfObjectToDraw(
    geometry,
    new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.33,
    })
  );

  obj3D.rotateX(Math.PI);

  return obj3D;
}
