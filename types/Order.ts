export interface IOrder{
    _id?:string;
    productId:string
    variant:{
        type:"SQUARE"|"WIDE"|"PORTRAIT";
        license:"personal"|"commerical"
    };
    status:"pending"|"completed"|"failed";
    amount:number;
}