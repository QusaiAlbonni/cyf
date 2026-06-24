import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { IsUniqueConstraintInput } from "./is-unique";
import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
@ValidatorConstraint({name:'IsUniqueConstraint',async:true})
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface{
  constructor(private readonly entityManager:EntityManager){}
 async validate(value: any, args?: ValidationArguments) {
    
    const{tableName,column}:IsUniqueConstraintInput=args?.constraints[0];
    const result=await this.entityManager.getRepository(tableName).createQueryBuilder(tableName).where({[column]:value}).getExists();
    return result? false:true;
  }
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return 'the recored already exist';
  }

}