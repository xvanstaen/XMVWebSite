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


    export class classUserLogin{
      id:string='';
      psw:string='';
      accessLevel='';
    }

    export class LoginIdentif{
      id:number=0;
      UserId:string='';
      phone:string='';
      firstname:string='';
      surname:string='';
      secLevel:string="";
      IpAddress:string='';
      userServerId:number=0;
      credentialDate:string='';
      apps:Array<string>=[];
      ownBuckets:Array<any>=[{name:""}];
      triggerFileSystem:string="Yes";
      performanceSport={
        bucket:"xmv-sport-performance",
        file:"",
        configSport:{
          bucket:"config-xmvit",
          files:{
            confChart:"configChartSport.json"
          },
          fileType:{
            confChart:"configChart"
          }
        }
        };
      circuits={
          bucket:"xmv-sport-performance",
          file:"myCircuit",
          };
      fitness={
        bucket:"xav_fitness",
        files:{
          fileHealth:"HealthTracking",
          fileFitnessMyConfig:"FitnessMyConfig",
          fileStartName:"FitStat-",
          fileStartLength:8,
          myChartConfig:"fitness1configChart",
          recipe:"fitnessRecipe",
        },
        fileType:{
          Health:"HealthTracking",
          FitnessMyConfig:"FitnessMyConfig",
          myChart:"myConfigChart",
          recipe:"fitnessRecipe",
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
          myLimit:0,
          maxLimit:0,
        },
        Calories:0,
        Carbs:0,
        Protein:0,
        Sugar:0,
        naturalSugar:0,
        addedSugar:0
      };
      recipe={
        bucket:'',
        fileType:'',
        fileStartName:'',
      };
      dictionary={
        bucket:'',
        fileType:'',
        fileName:'',
      };
      configCUSS={
        bucket:'',
        fileType:'',
        fileName:'',
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
  items:Array<OneBucketInfo>=[];
};


export class OneBucketInfo{
      kind:string='';
      bucket: string='';
      contentType: string='';
      crc32c: string='';
      etag: string='';
      generation: string='';
      id: string='';
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
      cacheControl:string='';
      metadata:any;

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

export class configPhoto{
  title:string= '';
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

}


export class XMVTestProd{
  TestFile:string="";
  ProdFile:string="";
}

export class UserParam{
    theId:string="XMVanstaen";
    theType:string="";
    log:boolean=false;
  } 

export class BucketList{
  Contact: string= "";
  UserInfo:   string= "";
  Console: string= "";
  Config:  string= "";
  Fitness:  string= "";
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
  test_prod:string= '';
  GoogleProjectId:string= '';
  project:string="";
  consoleBucket:string= '';
  googleServer:string= '';
  mongoServer:string= '';
  fileSystemServer:string= '';
  IpAddress:string= '';
  UserSpecific:Array<UserParam>=[];
  credentialDate:string='';
  bucketFileSystem:string='';
  objectFileSystem:string='';
  timeoutFileSystem={
    hh:0,
    mn:0,
    bufferTO:{
      hh:0,
      mn:0
    },
    bufferInput:{
      hh:0,
      mn:0
    },
    userTimeOut:{
      hh:0,
      mn:0,
      ss:0
    }
  };
  filesToCache:Array<classFilesToCache>=[];
  PointOfRef={
    bucket:"config-xmvit",
    file:"PointOfReference.json",
    };
  userLogin=new classUserLogin;
}

export class classFilesToCache{
  bucket:string="";
  object:string="";
}


export class classPosSlider{
  top:number=0;
  left:number=0;
  VerHor:string='';
  div={
    top:0,
    left:0
  }
}

export class   classCredentials {
    access_token:string=""; id_token:string=""; refresh_token:string=""; token_type:string="";
    userServerId:number=-1; creationDate:string=""
}

export class classTabMetaPerso { key:string=""; value:string=""; }

export class classtheEvent {
  target={
    id: '',
    textContent: '',
    value: ''
  };
  currentTarget={
    id: '',
    textContent: '',
    value: ''
  };
  checkLock=new classCheckLock;
  fileName:string='';
  bucket:string='';
  object:string='';
  fileContent:any;
  iWait:number=0;
  saveCalls:number=0;
  nbCalls:number=0;
}
export class classCheckLock{
  iWait:number=0;
  isDataModified:boolean=false;
  isSaveFile:boolean=false;
  lastInputAt:string='';
  iCheck:boolean=false;
  nbCalls:number=0;
  action:string='';
}

