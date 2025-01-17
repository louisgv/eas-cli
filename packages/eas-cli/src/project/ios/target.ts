import { ExpoConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import { Platform, Workflow } from '@expo/eas-build-job';

import { Target } from '../../credentials/ios/types';
import { resolveWorkflowAsync } from '../workflow';
import { getBundleIdentifierAsync } from './bundleIdentifier';
import { XcodeBuildContext } from './scheme';

export async function resolveTargetsAsync(
  { exp, projectDir }: { exp: ExpoConfig; projectDir: string },
  { buildConfiguration, buildScheme }: XcodeBuildContext
): Promise<Target[]> {
  const result: Target[] = [];

  const applicationTarget = await readApplicationTargetForSchemeAsync(projectDir, buildScheme);
  const bundleIdentifier = await getBundleIdentifierAsync(projectDir, exp, {
    targetName: applicationTarget.name,
    buildConfiguration,
  });
  result.push({
    targetName: applicationTarget.name,
    bundleIdentifier,
    buildConfiguration,
  });

  if (applicationTarget.dependencies && applicationTarget.dependencies.length > 0) {
    for (const dependency of applicationTarget.dependencies) {
      result.push({
        targetName: dependency.name,
        buildConfiguration,
        bundleIdentifier: await getBundleIdentifierAsync(projectDir, exp, {
          targetName: dependency.name,
          buildConfiguration,
        }),
        parentBundleIdentifier: bundleIdentifier,
      });
    }
  }

  return result;
}

async function readApplicationTargetForSchemeAsync(
  projectDir: string,
  scheme: string
): Promise<IOSConfig.Target.Target> {
  const workflow = await resolveWorkflowAsync(projectDir, Platform.IOS);
  if (workflow === Workflow.GENERIC) {
    return await IOSConfig.Target.findApplicationTargetWithDependenciesAsync(projectDir, scheme);
  } else {
    return {
      name: scheme,
      type: IOSConfig.Target.TargetType.APPLICATION,
      dependencies: [],
    };
  }
}

export function findApplicationTarget(targets: Target[]): Target {
  const applicationTarget = targets.find(({ parentBundleIdentifier }) => !parentBundleIdentifier);
  if (!applicationTarget) {
    throw new Error('Could not find the application target');
  }
  return applicationTarget;
}

export function findTargetByName(targets: Target[], name: string): Target {
  const target = targets.find(target => target.targetName === name);
  if (!target) {
    throw new Error(`Could not find target '${name}'`);
  }
  return target;
}
