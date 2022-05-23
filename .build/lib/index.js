var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// stacks/index.js
var stacks_exports = {};
__export(stacks_exports, {
  default: () => main
});
module.exports = __toCommonJS(stacks_exports);

// stacks/StorageStack.js
var sst = __toESM(require("@serverless-stack/resources"));
var StorageStack = class extends sst.Stack {
  table;
  bucket;
  constructor(scope, id, props) {
    super(scope, id, props);
    this.table = new sst.Table(this, "Notes", {
      fields: {
        userId: sst.TableFieldType.STRING,
        noteId: sst.TableFieldType.STRING
      },
      primaryIndex: { partitionKey: "userId", sortKey: "noteId" }
    });
    this.bucket = new sst.Bucket(this, "Uploads");
  }
};
__name(StorageStack, "StorageStack");

// stacks/ApiStack.js
var sst2 = __toESM(require("@serverless-stack/resources"));
var ApiStack = class extends sst2.Stack {
  api;
  constructor(scope, id, props) {
    super(scope, id, props);
    const { table } = props;
    this.api = new sst2.Api(this, "Api", {
      defaultFunctionProps: {
        environment: {
          TABLE_NAME: table.tableName,
          STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
        }
      },
      defaultAuthorizationType: "AWS_IAM",
      routes: {
        "POST   /notes": "src/create.main",
        "GET    /notes/{id}": "src/get.main",
        "GET    /notes": "src/list.main",
        "PUT    /notes/{id}": "src/update.main",
        "DELETE /notes/{id}": "src/delete.main",
        "POST /billing": "functions/billing.main"
      }
    });
    this.api.attachPermissions([table]);
    this.addOutputs({
      ApiEndpoint: this.api.url
    });
  }
};
__name(ApiStack, "ApiStack");

// stacks/AuthStack.js
var iam = __toESM(require("aws-cdk-lib/aws-iam"));
var sst3 = __toESM(require("@serverless-stack/resources"));
var AuthStack = class extends sst3.Stack {
  auth;
  constructor(scope, id, props) {
    super(scope, id, props);
    const { api, bucket } = props;
    this.auth = new sst3.Auth(this, "Auth", {
      cognito: {
        userPool: {
          signInAliases: { email: true }
        }
      }
    });
    this.auth.attachPermissionsForAuthUsers([
      api,
      new iam.PolicyStatement({
        actions: ["s3:*"],
        effect: iam.Effect.ALLOW,
        resources: [
          bucket.bucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*"
        ]
      })
    ]);
    this.addOutputs({
      Region: scope.region,
      UserPoolId: this.auth.cognitoUserPool.userPoolId,
      IdentityPoolId: this.auth.cognitoCfnIdentityPool.ref,
      UserPoolClientId: this.auth.cognitoUserPoolClient.userPoolClientId
    });
  }
};
__name(AuthStack, "AuthStack");

// stacks/index.js
function main(app) {
  const storageStack = new StorageStack(app, "storage");
  const apiStack = new ApiStack(app, "api", {
    table: storageStack.table
  });
  new AuthStack(app, "auth", {
    api: apiStack.api,
    bucket: storageStack.bucket
  });
}
__name(main, "main");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=index.js.map
