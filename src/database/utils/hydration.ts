import { ClassConstructor, plainToInstance } from 'class-transformer';
import { In, Repository, FindOptionsWhere } from 'typeorm';

export interface HydrateOptions<Parent, Child> {
  parentKey: keyof Parent;      // e.g. 'id'
  foreignKey: keyof Child;      // e.g. 'userId'
  relationProperty: keyof Parent; // e.g. 'docs'
  firstOnly?:boolean;
}


/**
 * Hydrates a list of parent entities by loading and mapping related child entities in a single query.
 *
 * @param parents - The list of parent entities to hydrate.
 * @param childRepo - The repository for the child entity.
 * @param options - Options specifying the key fields and relation property.
 * @param childDto - The child dto class that can be used to transform child entities.
 * @returns The hydrated list of parents.
 */
export async function hydrateRelation<
  Parent extends Record<string, any>,
  Child extends Record<string, any>,
  ChildDto
>(
  parents: Parent[],
  childRepo: Repository<Child>,
  options: HydrateOptions<Parent, Child>,
  childDto?: ClassConstructor<ChildDto>
): Promise<Parent[]> {
  const parentIds = parents.map(parent => parent[options.parentKey]);

  const children = await childRepo.find({
    where: { [options.foreignKey]: In(parentIds) } as FindOptionsWhere<Child>,
  });

  const childMap = new Map<any, (Child | ChildDto)[]>();
  // children.forEach(child => {
  //   const key = child[options.foreignKey];
  //   if (!childMap.has(key)) {
  //     childMap.set(key, []);
  //   }
  //   let transformedChild: ChildDto | Child = child
  //   if (childDto){
  //     transformedChild = plainToInstance(childDto, child)
  //   }
  //   childMap.get(key)!.push(transformedChild);
  // });

  // parents.forEach(parent => {
  //   (parent[options.relationProperty] as unknown[]) =
  //     childMap.get(parent[options.parentKey]) || [];
  // });
  children.forEach(child => {
    let fkValue = child[options.foreignKey];
    if (typeof fkValue === 'object' && fkValue !== null && 'id' in fkValue) {
      fkValue = fkValue.id;
    }
    if (!childMap.has(fkValue)) {
      childMap.set(fkValue, []);
    }
    let transformedChild: Child | ChildDto = child;
    if (childDto) {
      transformedChild = plainToInstance(childDto, child);
    }
    childMap.get(fkValue)!.push(transformedChild);
  });

  // Here we either assign the full array or only the first element if firstOnly is true.
  parents.forEach(parent => {
    const childrenArr = childMap.get(parent[options.parentKey]) || [];
    if (options.firstOnly) {
      (parent[options.relationProperty] as unknown)= childrenArr.length > 0 ? childrenArr[0] : [];
    } else {
      (parent[options.relationProperty] as unknown[])= childrenArr;
    }
  });

  return parents;
}
