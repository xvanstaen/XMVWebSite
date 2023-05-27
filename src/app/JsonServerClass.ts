export class BioDataList{
    id:number=0;
    name:string='';
    Topic:string='';
    element:string='';
    class:string='';
    style:string='';
  }
export class BioData{
    id:number=0;
    name:string='';
    Topic:string='';
    class:string='';
  }
  export class TopicURL {
    id:number=0;
    type:string='';
    topic:string='';
    url:string='';
    };

    export class LoginIdentif{
      id:number=0;
      key:number=0;
      method:string='';
      UserId:string='';
      psw:string='';
      phone:string='';
      firstname:string='';
      surname:string='';
      apps:Array<string>=[];
      ownBuckets:Array<any>=[{name:""}];
      fitness={
        bucket:"xav_fitness",
        files:{
          fileHealth:"HealthTracking",
          fileFitnessMyConfig:"FitnessMyConfig",
          fileStartName:"FitStat-",
          fileStartLength:8,
          myChartConfig:"fitness1configChart"
        },
        fileType:{
          Health:"HealthTracking",
          FitnessMyConfig:"FitnessMyConfig",
          myChart:"myConfigChart",
        }
      };
      configFitness={
        bucket:"config-xmvit",
        files:{
          convToDisplay:"ConvToDisplay.json",
          tabOfUnits:"ConvertTabOfUnits.json",
          weightReference:"ConvertWeightRefTable.json",
          convertUnit:"ConvertUnit.json",
          calories:"ConfigCaloriesFat",
          confHTML:"confTabHTML",
          confChart:"configChart",
        },
        fileType:{
          convToDisplay:"ConvToDisplay",
          tabOfUnits:"ConvertTabOfUnits",
          weightReference:"ConvertWeightRefTable",
          convertUnit:"ConvertUnit",
          calories:"ConfigCaloriesFat",
          confHTML:"confTabHTML",
          confChart:"configChart",

        }
      };
      health={
        weight:0,
        weightObjective:0,
        GI:0,
        SaturatedFat:0,
        Cholesterol:{
          minLimit:0,
          maxLimit:0,
        },
        Calories:0,
        Carbs:0,
        Protein:0
      };
    };

  export class EventAug {
      id: number=0;
      key:number=0;
      method:string='';
      UserId:string='';
      psw:string='';
      phone:string='';
      firstname:string='';
      surname:string='';
      night:string='';
      brunch:string='';
      nbinvitees:number=0;
      myComment:string='';
      yourComment:any;
      timeStamp:string='';
    };

    export class EventCommentStructure{
      dishMr:string='B';
      dishMrs:string='F';
      day:string='';
      golf:number=0;
      holes:number=0;
      practiceSaturday:string='y';
      bouleSaturday:string='y';
      bouleSunday:string='y';
      theComments:string='';
      readAccess:number=0;
      writeAccess:number=0;
    }

export class TableOfEventLogin{
  data:Array<EventAug>=[];
  psw:Array<string>=[];
  structureComment:string='';
}


 export class Bucket_List_Info{
  kind:string='storage#object';
  items:Array<any>=[
  {
      kind: "storage#object",
      id: "manage-login/Event-27AUG2022.json/1655279866897148",
      selfLink: "https://www.googleapis.com/storage/v1/b/manage-login/o/Event-27AUG2022.json", // link to the general info of the bucket/objectobject
      mediaLink: "https://storage.googleapis.com/download/storage/v1/b/manage-login/o/Event-27AUG2022.json?generation=1655279866897148&alt=media", // link to get the content of the object
      name: "Event-27AUG2022.json", // name of the object
      bucket: "manage-login", //name of the bucket
      cacheControl:"max-age=0, private, no-store",
      generation: "1655279866897148", 
      metageneration: "1",
      contentType: "application/json", 
      storageClass: "STANDARD", 
      size: "", // number of bytes
      md5Hash: "qdWPGdgcYW4N0Wc2lodB0g==",
      crc32c: "oLhslw==",
      etag: "CPzF4YP+rvgCEAE=",
      timeCreated: "2022-06-15T07:57:46.909Z",
      updated: "",
      timeStorageClassUpdated: "",
  }]
};


export class OneBucketInfo{
      bucket: string='';
      contentType: string='';
      crc32c: string='';
      etag: string='';
      generation: string='';
      id: string='';
      kind: string='';
      md5Hash: string='';
      mediaLink: string='';
      metageneration: string='';
      name: string='';
      selfLink: string='';
      size: string='';
      storageClass: string='';
      timeCreated: string='';
      timeStorageClassUpdated:  string='';
      updated: string='';

};


export class StructurePhotos{
  name:string='';
  mediaLink:string='';
  selfLink:string='';
  photo=new Image();
  vertical:boolean=false;
  isdiplayed:boolean=false;
 }

export class  BucketExchange{
  bucket_wedding_name:Array<string>=[];
  bucket_list_returned:Array<string>=[];
  Max_Nb_Bucket_Wedding:number=6;
  i_Bucket:number=0;
  array_i_loop:Array<number>=[];
  bucket_is_processed:boolean=false;
  GetOneBucketOnly:boolean=true;
  Nb_Buckets_processed:number=0;
}

export class XMVConfig{
  title:string= '';
  SourceJson_Google_Mongo:string= '';
  test_prod:string= '';
  GoogleProjectId:string= '';
  DB_Object:string= '';
  BucketLogin:string="";
  BucketConsole:string="";
  BucketContact:string="";
  BucketConfig:string="";
  BucketFitness:string='';
  Max_Nb_Bucket_Wedding:number=6;
  TabBucketPhoto:Array<string>=[];
  GetOneBucketOnly:boolean=false;
  // BucketWeddingRoot:string="";
  nb_photo_per_page:number=10;
  process_display_canvas:boolean=false;
  padding:number=10;
  width500:number=501;
  maxPhotosWidth500:number=3;
  width900:number=901;
  maxPhotosWidth900:number=6;
  maxWidth:number=1200;
  maxPhotosmaxWidth:number=9;
  UserSpecific:Array<UserParam>=[];
}


export class XMVTestProd{
  TestFile:string="";
  ProdFile:string="";
}

export class UserParam{
    id:string="XMVanstaen";
    type:string="";
    log:boolean=false;
  } 

export class BucketList{
  Contact: string= "XMV_messages";
  Login:   string= "manage-login";
  Console: string= "logconsole";
  Config:  string= "config-xmvit";
  Fitness:  string= "xav_fitness";
}

export class msgConsole{
  msg: string= '';
  timestamp:string= '';
}

export class Return_Data{
  Message:string= '';
  Error_Access_Server='';
  Error_code=0;
  SaveIsCancelled:boolean=false;
}

export class configServer{
  title:string= '';
  SourceJson_Google_Mongo:string= '';
  test_prod:string= '';
  GoogleProjectId:string= '';
  Mongo_Google:string= '';
  baseUrl:string= '';
}

export class classPosSlider{
  top:number=0;
  left:number=0;
  VerHor:string='';
}






