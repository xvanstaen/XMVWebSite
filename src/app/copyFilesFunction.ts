import { configServer, UserParam, classFilesToCache, classCredentials } from './JsonServerClass';
import { ClassItem, DailyReport, ClassMeal, ClassDish } from './Health/ClassHealthCalories';

/** Copies only the listed properties. */
const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> =>
  Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>;

// ---------------------------------------------------------------- config

export function fillConfig(inFile: configServer): configServer {
  const out = new configServer();
  const to = inFile.timeoutFileSystem;
  const user = inFile.userLogin;

  Object.assign(out, pick(inFile, [
    'title', 'test_prod', 'GoogleProjectId', 'consoleBucket',
    'googleServer', 'mongoServer', 'fileSystemServer',
    'project', 'IpAddress', 'bucketFileSystem', 'objectFileSystem',
  ]));
  out.credentialDate = inFile.credentialDate ?? '';

  const outTo = out.timeoutFileSystem;
  Object.assign(outTo, pick(to, ['hh', 'mn']));
  Object.assign(outTo.bufferTO, pick(to.bufferTO, ['hh', 'mn']));
  Object.assign(outTo.bufferInput, pick(to.bufferInput, ['hh', 'mn']));
  Object.assign(outTo.userTimeOut, to.userTimeOut
    ? pick(to.userTimeOut, ['hh', 'mn', 'ss'])
    : { hh: 0, mn: 8, ss: 45 });                       // default when missing

  Object.assign(out.PointOfRef, pick(inFile.PointOfRef, ['bucket', 'file']));

  Object.assign(out.userLogin, {
    id: user?.id ?? '',
    psw: user?.psw ?? '',
    accessLevel: user?.accessLevel ?? '',
  });

  out.filesToCache.push(
    ...inFile.filesToCache.map(f => Object.assign(new classFilesToCache(), pick(f, ['bucket', 'object'])))
  );

  const users = inFile.UserSpecific?.length
    ? inFile.UserSpecific.map(u => Object.assign(new UserParam(), pick(u, ['log', 'theId', 'theType'])))
    : [Object.assign(new UserParam(), { log: false, theId: '', theType: '' })];
  out.UserSpecific.push(...users);

  return out;
}

export function fillCredentials(inRecord: any): classCredentials {
  return Object.assign(new classCredentials(), pick(inRecord, [
    'access_token', 'id_token', 'refresh_token', 'token_type', 'creationDate', 'userServerId',
  ]));
}

// ---------------------------------------------------------------- health

const NUTRIENTS = ['Calories', 'Protein', 'Carbs', 'Cholesterol', 'Sugar', 'naturalSugar', 'addedSugar'] as const;

const normLock = (v?: string): 'Y' | 'N' => ((v ?? '').toUpperCase().trim() === 'Y' ? 'Y' : 'N');

/** Copy of a total. Old files without naturalSugar/addedSugar get 0. */
const copyTotal = (src: ClassItem): ClassItem =>
  Object.assign(new ClassItem(), src, {
    Fat: { ...src.Fat },
    naturalSugar: src.naturalSugar ?? 0,
    addedSugar: src.addedSugar ?? 0,
  });

function copyDish(src: ClassDish): ClassDish {
  const dish = new ClassDish();
  if (src.name === '') return dish;                    // empty row stays an empty placeholder

  dish.name = src.name;
  dish.quantity = src.quantity;
  dish.unit = src.unit;

  const from = src.calFat;
  const to = dish.calFat;
  for (const k of NUTRIENTS) to[k] = from[k];
  to.Fat.Saturated = from.Fat.Saturated;
  to.Fat.Total = from.Fat.Total;
  to.lockData = normLock(from.lockData);
  return dish;
}

function copyMeal(src: ClassMeal): ClassMeal {
  const meal = new ClassMeal();
  if (src.dish.length === 0) {
    meal.dish.push(new ClassDish());                   // keep one empty dish row
    return meal;
  }
  meal.name = src.name;
  meal.total = copyTotal(src.total);
  meal.dish = src.dish.map(copyDish);
  return meal;
}

function copyDay(src: DailyReport): DailyReport {
  const day = new DailyReport();
  day.burntCalories = src.burntCalories;
  day.date = src.date;
  day.total = copyTotal(src.total);
  day.meal = src.meal.map(copyMeal);
  return day;
}

export function FillHealthAllInOut(outFile: any, inFile: any) {
  outFile.updatedAt = inFile.updatedAt ?? '';
  outFile.tabDailyReport.push(...inFile.tabDailyReport.map((d: DailyReport) => copyDay(d)));
  return outFile;
}

/** Kept for existing callers. `iOut` is no longer needed. */
export function fillHealthOneDay(outFile: any, inFile: any, i: number, _iOut?: number) {
  outFile.tabDailyReport.push(copyDay(inFile.tabDailyReport[i]));
  return outFile;
}